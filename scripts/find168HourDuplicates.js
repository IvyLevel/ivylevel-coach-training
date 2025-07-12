const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training.firebaseio.com"
});

const db = admin.firestore();

async function find168HourDuplicates() {
  console.log('🔍 Finding duplicate 168-hour session entries...\n');
  
  try {
    // Find all 168-hour sessions
    const snapshot = await db.collection('indexed_videos')
      .where('is168HourSession', '==', true)
      .get();
    
    console.log(`Total 168-hour sessions found: ${snapshot.size}\n`);
    
    // Group by student and coach combination
    const sessionGroups = {};
    const allSessions = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const student = data.parsedStudent || data.student || 'Unknown';
      const coach = data.parsedCoach || data.coach || 'Unknown';
      const key = `${coach}_${student}`;
      
      const sessionInfo = {
        id: doc.id,
        student: student,
        coach: coach,
        title: data.title,
        driveId: data.driveId,
        date: data.date,
        createdAt: data.createdAt,
        filename: data.filename,
        fullData: data
      };
      
      allSessions.push(sessionInfo);
      
      if (!sessionGroups[key]) {
        sessionGroups[key] = [];
      }
      sessionGroups[key].push(sessionInfo);
    });
    
    // Display all 168-hour sessions
    console.log('📋 All 168-hour sessions:');
    allSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.coach} & ${session.student}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Title: ${session.title}`);
      console.log(`   DriveId: ${session.driveId}`);
      console.log(`   Filename: ${session.filename}`);
      console.log('---');
    });
    
    // Find duplicates
    console.log('\n\n🔍 Checking for duplicates...\n');
    const duplicateGroups = {};
    let totalDuplicates = 0;
    
    Object.entries(sessionGroups).forEach(([key, sessions]) => {
      if (sessions.length > 1) {
        duplicateGroups[key] = sessions;
        totalDuplicates += sessions.length - 1;
      }
    });
    
    if (Object.keys(duplicateGroups).length === 0) {
      console.log('✅ No duplicate 168-hour sessions found!');
      return;
    }
    
    console.log(`⚠️  Found ${Object.keys(duplicateGroups).length} groups with duplicates`);
    console.log(`Total duplicate entries to remove: ${totalDuplicates}\n`);
    
    // Display duplicate details
    Object.entries(duplicateGroups).forEach(([key, sessions]) => {
      const [coach, student] = key.split('_');
      console.log(`\n📌 ${coach} & ${student} has ${sessions.length} entries:`);
      
      sessions.forEach((session, index) => {
        console.log(`\n  ${index + 1}. Document ID: ${session.id}`);
        console.log(`     Title: ${session.title}`);
        console.log(`     DriveId: ${session.driveId}`);
        console.log(`     Created: ${session.createdAt?.toDate?.() || 'unknown'}`);
      });
      
      // Check if they have different driveIds
      const uniqueDriveIds = new Set(sessions.map(s => s.driveId));
      if (uniqueDriveIds.size > 1) {
        console.log(`\n  ⚠️  Different driveIds detected! This might be different videos.`);
      }
    });
    
    // Save report
    const duplicateReport = {
      timestamp: new Date().toISOString(),
      total168HourSessions: snapshot.size,
      duplicateGroups: duplicateGroups,
      totalDuplicatesToRemove: totalDuplicates
    };
    
    const fs = require('fs');
    fs.writeFileSync(
      path.join(__dirname, '168hour-duplicates-report.json'), 
      JSON.stringify(duplicateReport, null, 2)
    );
    console.log('\n💾 Duplicate report saved to: scripts/168hour-duplicates-report.json');
    
  } catch (error) {
    console.error('❌ Error finding duplicates:', error);
  } finally {
    await admin.app().delete();
  }
}

// Run the script
find168HourDuplicates();