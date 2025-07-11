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

async function verifyNameExtraction() {
  console.log('🔍 Verifying name extraction from filenames...\n');
  
  // Look for sessions that might have wrong names
  const snapshot = await db.collection('indexed_videos')
    .orderBy('uploadDate', 'desc')
    .limit(100)
    .get();
  
  const issues = [];
  const correct = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const filename = data.filename || '';
    
    // Skip non-coaching files
    if (!filename.startsWith('Coaching_') && !filename.startsWith('GamePlan_')) {
      return;
    }
    
    const parts = filename.split('_');
    if (parts.length >= 4) {
      const filenameCoach = parts[2];
      const filenameStudent = parts[3];
      const dbCoach = data.parsedCoach || data.coach || 'Unknown';
      const dbStudent = data.parsedStudent || data.student || 'Unknown';
      
      // Check if names match
      if (dbCoach !== filenameCoach || dbStudent !== filenameStudent) {
        issues.push({
          title: data.title || data.originalTitle,
          filename: filename,
          dbCoach: dbCoach,
          dbStudent: dbStudent,
          filenameCoach: filenameCoach,
          filenameStudent: filenameStudent
        });
      } else {
        correct.push({
          title: data.title || data.originalTitle,
          coach: dbCoach,
          student: dbStudent
        });
      }
    }
  });
  
  console.log(`✅ CORRECTLY PARSED (${correct.length} sessions):`);
  correct.slice(0, 5).forEach(item => {
    console.log(`  ${item.coach} & ${item.student}: ${item.title}`);
  });
  
  console.log(`\n❌ PARSING ISSUES (${issues.length} sessions):`);
  issues.forEach(issue => {
    console.log(`\n  Title: ${issue.title}`);
    console.log(`  Filename: ${issue.filename}`);
    console.log(`  Database: Coach="${issue.dbCoach}", Student="${issue.dbStudent}"`);
    console.log(`  From filename: Coach="${issue.filenameCoach}", Student="${issue.filenameStudent}"`);
  });
  
  // Look specifically for Rishi sessions
  console.log('\n\n🎯 SEARCHING FOR RISHI SESSIONS:');
  const rishiSnapshot = await db.collection('indexed_videos')
    .orderBy('uploadDate', 'desc')
    .limit(1000)
    .get();
  
  const rishiSessions = [];
  rishiSnapshot.forEach(doc => {
    const data = doc.data();
    const filename = data.filename || '';
    if (filename.includes('Rishi')) {
      rishiSessions.push({
        title: data.title || data.originalTitle,
        filename: filename,
        dbCoach: data.parsedCoach || data.coach || 'Unknown',
        dbStudent: data.parsedStudent || data.student || 'Unknown'
      });
    }
  });
  
  console.log(`Found ${rishiSessions.length} Rishi sessions:`);
  rishiSessions.forEach(session => {
    console.log(`\n  Title: ${session.title}`);
    console.log(`  File: ${session.filename}`);
    console.log(`  DB: Coach="${session.dbCoach}", Student="${session.dbStudent}"`);
  });
  
  process.exit(0);
}

verifyNameExtraction().catch(console.error);