const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
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

async function removeDuplicates() {
  console.log('🧹 Duplicate Removal Tool for indexed_videos\n');
  
  try {
    // Check if duplicates report exists
    const reportPath = path.join(__dirname, 'duplicates-report.json');
    if (!fs.existsSync(reportPath)) {
      console.log('❌ No duplicates report found. Please run findDuplicates.js first.');
      return;
    }
    
    // Load duplicates report
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    console.log(`📊 Loaded duplicate report from: ${report.timestamp}`);
    console.log(`Total duplicates to remove: ${report.duplicateSummary.totalDuplicatesToRemove}\n`);
    
    if (report.duplicateSummary.totalDuplicatesToRemove === 0) {
      console.log('✅ No duplicates to remove!');
      return;
    }
    
    // Create backup before removal
    console.log('💾 Creating backup before removal...');
    const backupData = [];
    const duplicatesToRemove = [];
    
    Object.entries(report.duplicates).forEach(([driveId, docs]) => {
      // Keep the first document, remove the rest
      for (let i = 1; i < docs.length; i++) {
        duplicatesToRemove.push({
          id: docs[i].id,
          data: docs[i].data
        });
        backupData.push({
          documentId: docs[i].id,
          driveId: driveId,
          data: docs[i].data
        });
      }
    });
    
    // Save backup
    const backupPath = path.join(__dirname, '..', 'backups', `duplicates-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saved to: ${backupPath}\n`);
    
    // Show what will be removed
    console.log('📋 Documents to be removed:');
    duplicatesToRemove.slice(0, 10).forEach(doc => {
      console.log(`- ${doc.id}: ${doc.data.title || 'Untitled'} (${doc.data.student || 'Unknown student'})`);
    });
    if (duplicatesToRemove.length > 10) {
      console.log(`... and ${duplicatesToRemove.length - 10} more\n`);
    }
    
    // Confirm removal
    const answer = await askQuestion(`\n⚠️  Are you sure you want to remove ${duplicatesToRemove.length} duplicate documents? (yes/no): `);
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Removal cancelled.');
      return;
    }
    
    // Remove duplicates
    console.log('\n🗑️  Removing duplicates...');
    let removed = 0;
    let errors = 0;
    
    // Process in batches to avoid overwhelming Firestore
    const batchSize = 100;
    for (let i = 0; i < duplicatesToRemove.length; i += batchSize) {
      const batch = db.batch();
      const currentBatch = duplicatesToRemove.slice(i, i + batchSize);
      
      currentBatch.forEach(doc => {
        const docRef = db.collection('indexed_videos').doc(doc.id);
        batch.delete(docRef);
      });
      
      try {
        await batch.commit();
        removed += currentBatch.length;
        console.log(`Progress: ${removed}/${duplicatesToRemove.length} documents removed`);
      } catch (error) {
        console.error(`❌ Error removing batch: ${error.message}`);
        errors += currentBatch.length;
      }
    }
    
    console.log('\n✅ Duplicate removal complete!');
    console.log(`- Successfully removed: ${removed} documents`);
    console.log(`- Errors: ${errors} documents`);
    
    // Verify removal
    console.log('\n🔍 Verifying removal...');
    const verifySnapshot = await db.collection('indexed_videos').get();
    console.log(`Total documents remaining: ${verifySnapshot.size}`);
    console.log(`Expected: ${report.totalDocuments - removed}`);
    
    if (verifySnapshot.size === report.totalDocuments - removed) {
      console.log('✅ Verification passed!');
    } else {
      console.log('⚠️  Document count mismatch. Please run findDuplicates.js again to check.');
    }
    
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
  } finally {
    rl.close();
    await admin.app().delete();
  }
}

// Run the script
removeDuplicates();