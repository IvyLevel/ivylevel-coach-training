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

async function verifyGamePlanCoaches() {
  console.log('🔍 Verifying Game Plan coach assignments...\n');
  
  const snapshot = await db.collection('indexed_videos')
    .where('category', '==', 'game_plan_reports')
    .get();
  
  console.log(`Found ${snapshot.size} Game Plan sessions\n`);
  
  const issues = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const filename = data.filename || '';
    const parsedCoach = data.parsedCoach || 'Unknown';
    const student = data.parsedStudent || data.student || 'Unknown';
    
    // Extract coach from filename
    let filenameCoach = 'Unknown';
    if (filename.includes('GamePlan_')) {
      const parts = filename.split('_');
      if (parts.length >= 4) {
        // Format: Coaching_GamePlan_B_Jenny_Ananyaa_...
        filenameCoach = parts[3]; // Jenny is at index 3
      }
    }
    
    // Check for Ananyaa specifically
    if (student === 'Ananyaa' || filename.includes('Ananyaa')) {
      console.log(`\n📌 ANANYAA's Game Plan:`);
      console.log(`  Filename: ${filename}`);
      console.log(`  Coach in filename: ${filenameCoach}`);
      console.log(`  parsedCoach in DB: ${parsedCoach}`);
      console.log(`  Duration: ${data.duration}`);
      console.log(`  Title: ${data.title}`);
      
      if (parsedCoach !== 'Jenny' && filenameCoach === 'Jenny') {
        console.log(`  ❌ ISSUE: Coach should be Jenny, not ${parsedCoach}`);
        issues.push({
          student: 'Ananyaa',
          wrongCoach: parsedCoach,
          correctCoach: filenameCoach,
          filename
        });
      }
    }
    
    // Check all sessions where filename has Jenny but parsedCoach is different
    if (filenameCoach === 'Jenny' && parsedCoach !== 'Jenny') {
      issues.push({
        student,
        wrongCoach: parsedCoach,
        correctCoach: filenameCoach,
        filename
      });
    }
  });
  
  console.log(`\n\n📊 SUMMARY:`);
  console.log(`Total issues where coach should be Jenny: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\nAffected sessions:');
    issues.forEach(issue => {
      console.log(`  - ${issue.student}: Shows "${issue.wrongCoach}" but should be "Jenny"`);
    });
  }
  
  process.exit(0);
}

verifyGamePlanCoaches().catch(console.error);