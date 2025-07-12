const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training.firebaseio.com"
});

const db = admin.firestore();

async function fixAnanyaaDuplicateGamePlan() {
  console.log('🔧 Fixing Ananyaa\'s duplicate Game Plan entries (Auto Mode)...\n');
  
  try {
    // Find Ananyaa's game plan entries
    const gameplanQuery = await db.collection('indexed_videos')
      .where('parsedStudent', '==', 'Ananyaa')
      .where('category', '==', 'game_plan_reports')
      .get();
    
    const entries = [];
    gameplanQuery.forEach(doc => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        title: data.title,
        driveId: data.driveId,
        createdAt: data.createdAt,
        coach: data.parsedCoach || data.coach,
        filename: data.filename,
        fullData: data
      });
    });
    
    console.log(`Found ${entries.length} Game Plan entries for Ananyaa:\n`);
    
    entries.forEach((entry, index) => {
      console.log(`${index + 1}. Document ID: ${entry.id}`);
      console.log(`   Title: ${entry.title}`);
      console.log(`   DriveId: ${entry.driveId}`);
      console.log(`   Coach: ${entry.coach}`);
      console.log(`   Created: ${entry.createdAt?.toDate?.() || 'unknown'}`);
      console.log('---');
    });
    
    if (entries.length <= 1) {
      console.log('\n✅ No duplicates found for Ananyaa\'s Game Plan.');
      return;
    }
    
    console.log('\n⚠️  Found duplicate Game Plan entries!');
    console.log('These appear to be the same video with different driveIds.');
    
    // Sort by creation date to keep the older one (or first one if no dates)
    entries.sort((a, b) => {
      const dateA = a.createdAt?._seconds || 0;
      const dateB = b.createdAt?._seconds || 0;
      return dateA - dateB;
    });
    
    console.log(`\n📌 Will keep: ${entries[0].id} (driveId: ${entries[0].driveId})`);
    console.log(`🗑️  Will remove: ${entries.slice(1).map(e => e.id).join(', ')}`);
    
    // Create backup
    const backupData = entries.slice(1).map(entry => ({
      documentId: entry.id,
      data: entry.fullData
    }));
    
    const backupPath = path.join(__dirname, `ananyaa-gameplan-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`\n💾 Backup saved to: ${backupPath}`);
    
    // Remove duplicates
    console.log('\n🗑️  Removing duplicates...');
    for (let i = 1; i < entries.length; i++) {
      await db.collection('indexed_videos').doc(entries[i].id).delete();
      console.log(`✅ Removed: ${entries[i].id}`);
    }
    
    console.log('\n✅ Duplicate removal complete!');
    
    // Verify
    const verifyQuery = await db.collection('indexed_videos')
      .where('parsedStudent', '==', 'Ananyaa')
      .where('category', '==', 'game_plan_reports')
      .get();
    
    console.log(`\n🔍 Verification: ${verifyQuery.size} Game Plan entry/entries remaining for Ananyaa.`);
    
    // Check for other students with duplicate game plans
    console.log('\n🔍 Checking for other students with duplicate game plans...\n');
    
    const allGamePlans = await db.collection('indexed_videos')
      .where('category', '==', 'game_plan_reports')
      .get();
    
    const studentGamePlans = {};
    allGamePlans.forEach(doc => {
      const data = doc.data();
      const student = data.parsedStudent || data.student || 'Unknown';
      if (!studentGamePlans[student]) {
        studentGamePlans[student] = [];
      }
      studentGamePlans[student].push({
        id: doc.id,
        title: data.title,
        driveId: data.driveId
      });
    });
    
    let foundOtherDuplicates = false;
    Object.entries(studentGamePlans).forEach(([student, plans]) => {
      if (plans.length > 1) {
        foundOtherDuplicates = true;
        console.log(`⚠️  ${student} has ${plans.length} game plan entries:`);
        plans.forEach(plan => {
          console.log(`   - ${plan.title} (${plan.driveId})`);
        });
      }
    });
    
    if (!foundOtherDuplicates) {
      console.log('✅ No other students have duplicate game plan entries.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await admin.app().delete();
  }
}

// Run the script
fixAnanyaaDuplicateGamePlan().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});