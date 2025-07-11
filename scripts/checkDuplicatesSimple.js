const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate entries...\n');
  
  try {
    // Get all indexed videos
    const snapshot = await getDocs(collection(db, 'indexed_videos'));
    console.log(`Total documents: ${snapshot.size}\n`);
    
    // Group by filename to find duplicates
    const fileGroups = {};
    const driveIdGroups = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const filename = data.filename || 'unknown';
      const driveId = data.driveId;
      
      // Group by filename
      if (!fileGroups[filename]) {
        fileGroups[filename] = [];
      }
      fileGroups[filename].push({ id: doc.id, ...data });
      
      // Group by driveId
      if (driveId) {
        if (!driveIdGroups[driveId]) {
          driveIdGroups[driveId] = [];
        }
        driveIdGroups[driveId].push({ id: doc.id, ...data });
      }
    });
    
    // Find duplicates by filename
    console.log('📁 Duplicates by filename:');
    let duplicateCount = 0;
    for (const [filename, docs] of Object.entries(fileGroups)) {
      if (docs.length > 1) {
        duplicateCount++;
        console.log(`\n${filename} (${docs.length} copies):`);
        docs.forEach(doc => {
          console.log(`  - ID: ${doc.id}`);
          console.log(`    Coach: ${doc.parsedCoach || doc.coach || 'Unknown'}`);
          console.log(`    Student: ${doc.parsedStudent || doc.student || 'Unknown'}`);
          console.log(`    Category: ${doc.category}`);
          console.log(`    Duration: ${doc.duration}`);
          console.log(`    is168HourSession: ${doc.is168HourSession}`);
        });
      }
    }
    
    if (duplicateCount === 0) {
      console.log('No duplicates found by filename.');
    } else {
      console.log(`\nFound ${duplicateCount} filenames with duplicates.`);
    }
    
    // Find duplicates by driveId
    console.log('\n\n📁 Duplicates by Google Drive ID:');
    let driveIdDuplicateCount = 0;
    for (const [driveId, docs] of Object.entries(driveIdGroups)) {
      if (docs.length > 1) {
        driveIdDuplicateCount++;
        console.log(`\nDrive ID: ${driveId} (${docs.length} copies):`);
        docs.forEach(doc => {
          console.log(`  - ID: ${doc.id}`);
          console.log(`    Filename: ${doc.filename}`);
          console.log(`    Category: ${doc.category}`);
        });
      }
    }
    
    if (driveIdDuplicateCount === 0) {
      console.log('No duplicates found by Drive ID.');
    } else {
      console.log(`\nFound ${driveIdDuplicateCount} Drive IDs with duplicates.`);
    }
    
    // Check for 168-hour sessions specifically
    console.log('\n\n🕐 168-Hour Sessions:');
    const sessions168 = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.is168HourSession || data.filename?.includes('_168_')) {
        sessions168.push({ id: doc.id, ...data });
      }
    });
    
    console.log(`Found ${sessions168.length} 168-hour sessions`);
    if (sessions168.length > 0) {
      console.log('\nFirst 5 168-hour sessions:');
      sessions168.slice(0, 5).forEach(session => {
        console.log(`\n- ${session.filename}`);
        console.log(`  ID: ${session.id}`);
        console.log(`  Duration: ${session.duration}`);
        console.log(`  Coach: ${session.parsedCoach || session.coach}`);
        console.log(`  Student: ${session.parsedStudent || session.student}`);
      });
    }
    
    // Check for Game Plan sessions
    console.log('\n\n🎯 Game Plan Sessions:');
    const gamePlans = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.filename?.includes('GamePlan') || data.category === 'game_plan_reports' || data.sessionType === 'game_plan') {
        gamePlans.push({ id: doc.id, ...data });
      }
    });
    
    console.log(`Found ${gamePlans.length} Game Plan sessions`);
    if (gamePlans.length > 0) {
      console.log('\nFirst 5 Game Plan sessions:');
      gamePlans.slice(0, 5).forEach(plan => {
        console.log(`\n- ${plan.filename}`);
        console.log(`  ID: ${plan.id}`);
        console.log(`  Duration: ${plan.duration}`);
        console.log(`  Coach: ${plan.parsedCoach || plan.coach}`);
        console.log(`  Student: ${plan.parsedStudent || plan.student}`);
      });
    }
    
    // Check specific duration format issues
    console.log('\n\n⏱️  Duration Format Analysis:');
    const durationFormats = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      const duration = data.duration || 'no duration';
      if (!durationFormats[duration]) {
        durationFormats[duration] = 0;
      }
      durationFormats[duration]++;
    });
    
    console.log('Duration value distribution:');
    Object.entries(durationFormats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([duration, count]) => {
        console.log(`  ${duration}: ${count} documents`);
      });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDuplicates();