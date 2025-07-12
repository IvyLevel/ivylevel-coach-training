const admin = require('firebase-admin');
const path = require('path');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training.firebaseio.com"
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function fixAnanyaaDuplicateGamePlan() {
  console.log('🔧 Fixing Ananyaa\'s duplicate Game Plan entries...\n');
  
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
        filename: data.filename
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
    
    // Sort by creation date to keep the older one
    entries.sort((a, b) => {
      const dateA = a.createdAt?._seconds || 0;
      const dateB = b.createdAt?._seconds || 0;
      return dateA - dateB;
    });
    
    console.log(`\n📌 Will keep: ${entries[0].id} (driveId: ${entries[0].driveId})`);
    console.log(`🗑️  Will remove: ${entries.slice(1).map(e => e.id).join(', ')}`);
    
    const answer = await askQuestion('\nDo you want to proceed with removing the duplicate(s)? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      return;
    }
    
    // Create backup
    const backupData = entries.slice(1).map(entry => ({
      documentId: entry.id,
      data: entry
    }));
    
    const fs = require('fs');
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
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
    await admin.app().delete();
  }
}

// Run the script
fixAnanyaaDuplicateGamePlan().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});