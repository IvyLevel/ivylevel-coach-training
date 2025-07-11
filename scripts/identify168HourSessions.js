const admin = require('firebase-admin');
const path = require('path');

// Initialize Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Keywords and patterns that indicate 168-hour scheduling
const KEYWORDS_168 = [
  '168 hour', '168-hour', '168hour', '168 hr', '168hr',
  'weekly schedule', 'weekly scheduling', 'time management',
  'hourly schedule', 'hour by hour', 'time blocking',
  'weekly planning', 'week planning', 'schedule planning',
  'time allocation', 'time tracking', 'productivity system',
  'session 2', 'session two', 'second session',
  'week 2', 'week two', 'second week'
];

// Patterns that suggest it's NOT a 168-hour session
const NEGATIVE_PATTERNS = [
  'game plan', 'gameplan', 'college list', 'university selection',
  'essay', 'application', 'admission', 'sat', 'act',
  'final', 'last session', 'wrap up', 'conclusion'
];

// Score calculation based on different signals
function calculate168Score(data, gameplanDate) {
  let score = 0;
  const signals = [];
  
  // 1. Check filename (medium fidelity)
  const filename = (data.filename || '').toLowerCase();
  if (filename.includes('168') || filename.includes('scheduling')) {
    score += 30;
    signals.push('Filename contains 168/scheduling');
  }
  
  // 2. Check title (medium fidelity)
  const title = (data.title || data.originalTitle || '').toLowerCase();
  KEYWORDS_168.forEach(keyword => {
    if (title.includes(keyword)) {
      score += 25;
      signals.push(`Title contains: ${keyword}`);
    }
  });
  
  // 3. Check for session 2 or week 2 indicators
  if (title.match(/session\s*2|week\s*2|second\s*(session|week)/i)) {
    score += 20;
    signals.push('Title indicates session/week 2');
  }
  
  // 4. Check metadata fields (low-medium fidelity)
  const description = (data.description || '').toLowerCase();
  const tags = (data.tags || []).map(t => t.toLowerCase());
  const notes = (data.notes || '').toLowerCase();
  
  KEYWORDS_168.forEach(keyword => {
    if (description.includes(keyword) || notes.includes(keyword)) {
      score += 15;
      signals.push(`Metadata contains: ${keyword}`);
    }
    if (tags.some(tag => tag.includes(keyword))) {
      score += 20;
      signals.push(`Tag contains: ${keyword}`);
    }
  });
  
  // 5. Timing analysis relative to game plan (high fidelity if game plan exists)
  if (gameplanDate && data.sessionDate) {
    const sessionDate = new Date(data.sessionDate);
    const gpDate = new Date(gameplanDate);
    const daysDiff = Math.floor((sessionDate - gpDate) / (1000 * 60 * 60 * 24));
    
    // 168-hour sessions typically happen 7-21 days after game plan
    if (daysDiff >= 5 && daysDiff <= 25) {
      score += 35;
      signals.push(`Session is ${daysDiff} days after game plan (typical range)`);
      
      // Extra points if it's exactly 1-2 weeks after
      if (daysDiff >= 7 && daysDiff <= 14) {
        score += 15;
        signals.push('Session is 1-2 weeks after game plan (ideal timing)');
      }
    }
  }
  
  // 6. Check for week number
  const weekMatch = (data.parsedWeek || data.week || '').toString();
  if (weekMatch === '2' || weekMatch === '02') {
    score += 25;
    signals.push('Week number is 2');
  }
  
  // 7. Duration check (168-hour sessions are typically longer)
  if (data.duration) {
    const durationMatch = data.duration.match(/(\d+):(\d+)/);
    if (durationMatch) {
      const totalMinutes = parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]);
      if (totalMinutes >= 45) {
        score += 10;
        signals.push(`Long session duration: ${data.duration}`);
      }
    }
  }
  
  // 8. Negative signals (reduce score)
  NEGATIVE_PATTERNS.forEach(pattern => {
    if (title.includes(pattern) || description.includes(pattern)) {
      score -= 20;
      signals.push(`Negative pattern found: ${pattern}`);
    }
  });
  
  // 9. Category check
  if (data.category === 'student_sessions' && !data.category.includes('game_plan')) {
    score += 5;
    signals.push('Category is student_sessions');
  }
  
  return { score, signals };
}

async function identify168HourSessions() {
  console.log('🔍 Starting intelligent 168-hour session identification...\n');
  
  // First, get all sessions
  const snapshot = await db.collection('indexed_videos').orderBy('uploadDate', 'desc').get();
  
  // Group sessions by student
  const studentSessions = {};
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const student = data.parsedStudent || data.student || 'Unknown';
    
    if (!studentSessions[student]) {
      studentSessions[student] = [];
    }
    
    studentSessions[student].push({
      id: doc.id,
      data: data
    });
  });
  
  // Analyze each student's sessions
  const identified168Sessions = [];
  const potential168Sessions = [];
  
  for (const [student, sessions] of Object.entries(studentSessions)) {
    if (student === 'Unknown' || student === 'unknown') continue;
    
    // Find game plan session for this student
    const gameplanSession = sessions.find(s => 
      s.data.filename?.includes('GamePlan') || 
      s.data.category === 'game_plan_reports'
    );
    
    const gameplanDate = gameplanSession?.data.sessionDate || gameplanSession?.data.uploadDate;
    
    // Analyze each session
    sessions.forEach(session => {
      const { score, signals } = calculate168Score(session.data, gameplanDate);
      
      if (score >= 70) {
        // High confidence - definitely a 168-hour session
        identified168Sessions.push({
          id: session.id,
          student,
          coach: session.data.parsedCoach || session.data.coach || 'Unknown',
          title: session.data.title || session.data.originalTitle,
          date: session.data.sessionDate || session.data.uploadDate,
          score,
          signals,
          confidence: 'HIGH'
        });
      } else if (score >= 40) {
        // Medium confidence - likely a 168-hour session
        potential168Sessions.push({
          id: session.id,
          student,
          coach: session.data.parsedCoach || session.data.coach || 'Unknown',
          title: session.data.title || session.data.originalTitle,
          date: session.data.sessionDate || session.data.uploadDate,
          score,
          signals,
          confidence: 'MEDIUM'
        });
      }
    });
  }
  
  // Sort by confidence score
  identified168Sessions.sort((a, b) => b.score - a.score);
  potential168Sessions.sort((a, b) => b.score - a.score);
  
  // Display results
  console.log('📊 ANALYSIS COMPLETE!\n');
  console.log(`✅ HIGH CONFIDENCE 168-HOUR SESSIONS (${identified168Sessions.length}):`);
  identified168Sessions.forEach(session => {
    console.log(`\n🎯 ${session.title}`);
    console.log(`   Coach: ${session.coach}, Student: ${session.student}`);
    console.log(`   Date: ${new Date(session.date).toLocaleDateString()}`);
    console.log(`   Score: ${session.score}`);
    console.log(`   Signals:`);
    session.signals.forEach(signal => console.log(`     - ${signal}`));
    console.log(`   Document ID: ${session.id}`);
  });
  
  console.log(`\n\n⚠️  MEDIUM CONFIDENCE 168-HOUR SESSIONS (${potential168Sessions.length}):`);
  potential168Sessions.slice(0, 10).forEach(session => {
    console.log(`\n📌 ${session.title}`);
    console.log(`   Coach: ${session.coach}, Student: ${session.student}`);
    console.log(`   Date: ${new Date(session.date).toLocaleDateString()}`);
    console.log(`   Score: ${session.score}`);
    console.log(`   Signals:`);
    session.signals.forEach(signal => console.log(`     - ${signal}`));
    console.log(`   Document ID: ${session.id}`);
  });
  
  // Prepare for tagging
  console.log('\n\n🏷️  PREPARING TO TAG SESSIONS...');
  console.log(`Will tag ${identified168Sessions.length} high-confidence sessions as 168-hour sessions`);
  
  // Ask for confirmation before updating
  console.log('\n⚠️  To actually update these sessions with 168-hour tags, run:');
  console.log('   node scripts/tag168HourSessions.js');
  
  // Save results to a file for the tagging script
  const fs = require('fs');
  fs.writeFileSync(
    path.join(__dirname, '168hour_sessions.json'),
    JSON.stringify({
      highConfidence: identified168Sessions,
      mediumConfidence: potential168Sessions,
      analyzedAt: new Date().toISOString()
    }, null, 2)
  );
  
  console.log('\n💾 Results saved to scripts/168hour_sessions.json');
  
  process.exit(0);
}

identify168HourSessions().catch(console.error);