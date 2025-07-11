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

async function analyzeAllCoachingSessions() {
  console.log('🔍 Analyzing ALL coaching sessions in database...\n');
  
  const snapshot = await db.collection('indexed_videos').get();
  
  const stats = {
    total: 0,
    coachingSessions: 0,
    gamePlanSessions: 0,
    quickCheckIns: 0,
    miscellaneous: 0,
    byCoach: {},
    byStudent: {},
    byMonth: {},
    filtered: []
  };
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const filename = data.filename || '';
    const folderPath = data.folderPath || '';
    
    stats.total++;
    
    // Count Quick Check-ins
    if (filename.includes('TRIVIAL_') || data.category === 'Quick Check-in') {
      stats.quickCheckIns++;
      return;
    }
    
    // Count Miscellaneous
    if (folderPath.includes('/Miscellaneous/') || filename.includes('MISC_') || 
        data.category === 'Miscellaneous') {
      stats.miscellaneous++;
      return;
    }
    
    // Count proper coaching sessions
    const isCoachingSession = 
      filename.startsWith('Coaching_') || 
      filename.startsWith('GamePlan_') ||
      data.category === 'student_sessions' ||
      data.category === 'game_plan_reports';
      
    if (isCoachingSession) {
      stats.coachingSessions++;
      
      if (filename.includes('GamePlan') || data.category === 'game_plan_reports') {
        stats.gamePlanSessions++;
      }
      
      // Extract coach and student
      let coachName = data.parsedCoach || data.coach || 'Unknown';
      let studentName = data.parsedStudent || data.student || 'Unknown';
      
      // Try to extract from filename
      if (filename && (filename.startsWith('Coaching_') || filename.startsWith('GamePlan_'))) {
        const parts = filename.split('_');
        if (parts.length >= 4) {
          const filenameCoach = parts[2];
          const filenameStudent = parts[3];
          
          if (coachName === 'Unknown' || coachName === 'unknown') {
            if (filenameCoach && filenameCoach !== 'unknown') {
              coachName = filenameCoach;
            }
          }
          
          if (studentName === 'Unknown' || studentName === 'unknown') {
            if (filenameStudent && filenameStudent !== 'unknown') {
              studentName = filenameStudent;
            }
          }
        }
      }
      
      // Count by coach
      stats.byCoach[coachName] = (stats.byCoach[coachName] || 0) + 1;
      
      // Count by student
      stats.byStudent[studentName] = (stats.byStudent[studentName] || 0) + 1;
      
      // Count by month
      const date = data.sessionDate || data.uploadDate;
      if (date) {
        const monthKey = new Date(date).toISOString().slice(0, 7); // YYYY-MM
        stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
      }
      
      // Add to filtered list
      stats.filtered.push({
        id: doc.id,
        title: data.title || data.originalTitle,
        coach: coachName,
        student: studentName,
        date: data.sessionDate || data.uploadDate,
        category: data.category,
        filename: filename
      });
    }
  });
  
  // Print comprehensive statistics
  console.log('📊 COMPREHENSIVE STATISTICS:');
  console.log(`Total documents in database: ${stats.total}`);
  console.log(`\n✅ Coaching Sessions: ${stats.coachingSessions}`);
  console.log(`   - Regular Sessions: ${stats.coachingSessions - stats.gamePlanSessions}`);
  console.log(`   - Game Plan Sessions: ${stats.gamePlanSessions}`);
  console.log(`\n❌ Excluded Content:`);
  console.log(`   - Quick Check-ins: ${stats.quickCheckIns}`);
  console.log(`   - Miscellaneous: ${stats.miscellaneous}`);
  console.log(`   - Other/Unknown: ${stats.total - stats.coachingSessions - stats.quickCheckIns - stats.miscellaneous}`);
  
  console.log('\n\n👥 SESSIONS BY COACH:');
  Object.entries(stats.byCoach)
    .sort((a, b) => b[1] - a[1])
    .forEach(([coach, count]) => {
      console.log(`   ${coach}: ${count} sessions`);
    });
  
  console.log('\n\n🎓 SESSIONS BY STUDENT:');
  Object.entries(stats.byStudent)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20) // Top 20 students
    .forEach(([student, count]) => {
      console.log(`   ${student}: ${count} sessions`);
    });
  
  console.log('\n\n📅 SESSIONS BY MONTH:');
  Object.entries(stats.byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12) // Last 12 months
    .forEach(([month, count]) => {
      console.log(`   ${month}: ${count} sessions`);
    });
  
  console.log('\n\n🎬 SAMPLE RECENT SESSIONS:');
  stats.filtered
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
    .forEach(session => {
      console.log(`\n   Title: ${session.title}`);
      console.log(`   Coach: ${session.coach}, Student: ${session.student}`);
      console.log(`   Date: ${new Date(session.date).toLocaleDateString()}`);
      console.log(`   Category: ${session.category}`);
    });
  
  console.log(`\n\n✨ SUMMARY: ${stats.coachingSessions} coaching sessions ready to display!`);
  
  process.exit(0);
}

analyzeAllCoachingSessions().catch(console.error);