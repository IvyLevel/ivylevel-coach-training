const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training.firebaseio.com"
});

const db = admin.firestore();

async function debugAnanyaaGamePlan() {
  console.log('🔍 Debugging Ananyaa Game Plan entries...\n');
  
  try {
    // Search for all documents that might be Ananyaa's game plan
    const snapshot = await db.collection('indexed_videos').get();
    
    const ananyaaEntries = [];
    const gameplanEntries = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = data.title || '';
      const student = data.student || '';
      const parsedStudent = data.parsedStudent || '';
      const filename = data.filename || '';
      
      // Check if this is Ananyaa-related
      if (student.toLowerCase().includes('ananyaa') || 
          parsedStudent.toLowerCase().includes('ananyaa') ||
          title.toLowerCase().includes('ananyaa') ||
          filename.toLowerCase().includes('ananyaa')) {
        ananyaaEntries.push({
          id: doc.id,
          title: title,
          student: student,
          parsedStudent: parsedStudent,
          coach: data.coach,
          parsedCoach: data.parsedCoach,
          driveId: data.driveId,
          category: data.category,
          filename: filename,
          type: data.type
        });
      }
      
      // Check if this is a game plan
      if (title.toLowerCase().includes('game plan') ||
          filename.toLowerCase().includes('gameplan') ||
          data.category === 'game_plan_reports') {
        gameplanEntries.push({
          id: doc.id,
          title: title,
          student: parsedStudent || student,
          coach: data.parsedCoach || data.coach,
          driveId: data.driveId,
          category: data.category
        });
      }
    });
    
    console.log(`📊 Found ${ananyaaEntries.length} Ananyaa-related entries:`);
    ananyaaEntries.forEach((entry, index) => {
      console.log(`\n${index + 1}. Document ID: ${entry.id}`);
      console.log(`   Title: ${entry.title}`);
      console.log(`   Student: ${entry.parsedStudent || entry.student}`);
      console.log(`   Coach: ${entry.parsedCoach || entry.coach}`);
      console.log(`   Category: ${entry.category}`);
      console.log(`   DriveId: ${entry.driveId}`);
      console.log(`   Filename: ${entry.filename}`);
    });
    
    console.log(`\n\n📋 All Game Plan entries (${gameplanEntries.length} total):`);
    const groupedByStudent = {};
    gameplanEntries.forEach(entry => {
      const student = entry.student || 'Unknown';
      if (!groupedByStudent[student]) {
        groupedByStudent[student] = [];
      }
      groupedByStudent[student].push(entry);
    });
    
    Object.entries(groupedByStudent).forEach(([student, entries]) => {
      console.log(`\n${student}: ${entries.length} game plan(s)`);
      entries.forEach(entry => {
        console.log(`  - Coach: ${entry.coach}, DriveId: ${entry.driveId}`);
      });
    });
    
    // Check for exact duplicates with same driveId
    const driveIdMap = {};
    ananyaaEntries.forEach(entry => {
      if (entry.driveId) {
        if (!driveIdMap[entry.driveId]) {
          driveIdMap[entry.driveId] = [];
        }
        driveIdMap[entry.driveId].push(entry);
      }
    });
    
    console.log('\n\n🔍 Checking for same driveId entries:');
    Object.entries(driveIdMap).forEach(([driveId, entries]) => {
      if (entries.length > 1) {
        console.log(`\n⚠️  DriveId ${driveId} has ${entries.length} entries:`);
        entries.forEach(e => console.log(`   - ${e.title} (ID: ${e.id})`));
      }
    });
    
  } catch (error) {
    console.error('❌ Error debugging:', error);
  } finally {
    await admin.app().delete();
  }
}

// Run the script
debugAnanyaaGamePlan();