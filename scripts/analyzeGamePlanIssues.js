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

async function analyzeGamePlanIssues() {
  console.log('🔍 Analyzing Game Plan and title issues...\n');
  
  const snapshot = await db.collection('indexed_videos')
    .orderBy('uploadDate', 'desc')
    .limit(500)
    .get();
  
  const gamePlanSessions = [];
  const titleIssues = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const filename = data.filename || '';
    const title = data.title || data.originalTitle || '';
    
    // Check for GamePlan sessions
    if (filename.includes('GamePlan') || title.includes('Gameplan') || title.includes('Game Plan')) {
      gamePlanSessions.push({
        id: doc.id,
        title: title,
        filename: filename,
        folderPath: data.folderPath || '',
        coach: data.parsedCoach || data.coach || 'Unknown',
        student: data.parsedStudent || data.student || 'Unknown',
        category: data.category
      });
    }
    
    // Check for titles with only coach name (missing student)
    if (title.match(/^(Rishi|Jenny|Marissa|Juli|Andrew|Noor) - Week/i) || 
        title.match(/^B & (Rishi|Jenny|Marissa|Juli|Andrew|Noor) - Week/i)) {
      titleIssues.push({
        id: doc.id,
        title: title,
        filename: filename,
        coach: data.parsedCoach || data.coach || 'Unknown',
        student: data.parsedStudent || data.student || 'Unknown'
      });
    }
  });
  
  console.log(`📊 GAME PLAN SESSIONS (${gamePlanSessions.length} found):`);
  gamePlanSessions.slice(0, 10).forEach(session => {
    console.log(`\nTitle: ${session.title}`);
    console.log(`Filename: ${session.filename}`);
    console.log(`Coach: ${session.coach}, Student: ${session.student}`);
    console.log(`Category: ${session.category}`);
  });
  
  console.log(`\n\n❌ TITLE ISSUES - Missing Student Name (${titleIssues.length} found):`);
  titleIssues.slice(0, 10).forEach(issue => {
    console.log(`\nTitle: ${issue.title}`);
    console.log(`Should be: ${issue.coach} & ${issue.student} - ${issue.title.split(' - ')[1] || 'Session'}`);
    console.log(`Filename: ${issue.filename}`);
  });
  
  // Analyze filename patterns
  console.log('\n\n📋 GAME PLAN FILENAME PATTERNS:');
  const patterns = new Set();
  gamePlanSessions.forEach(session => {
    if (session.filename.includes('GamePlan')) {
      const parts = session.filename.split('_');
      if (parts.length >= 5) {
        patterns.add(`${parts[0]}_${parts[1]}_[Coach]_[Student]_[Week]...`);
      }
    }
  });
  
  console.log('Patterns found:');
  patterns.forEach(pattern => console.log(`  ${pattern}`));
  
  process.exit(0);
}

analyzeGamePlanIssues().catch(console.error);