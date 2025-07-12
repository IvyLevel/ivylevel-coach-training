const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training.firebaseio.com"
});

const db = admin.firestore();

async function findDuplicates() {
  console.log('🔍 Finding duplicate entries in indexed_videos collection...\n');
  
  try {
    // Get all documents from indexed_videos
    const snapshot = await db.collection('indexed_videos').get();
    console.log(`Total documents in collection: ${snapshot.size}\n`);
    
    // Group documents by driveId
    const documentsByDriveId = {};
    const duplicates = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const driveId = data.driveId;
      
      if (!driveId) {
        console.log(`⚠️  Document ${doc.id} has no driveId`);
        return;
      }
      
      if (!documentsByDriveId[driveId]) {
        documentsByDriveId[driveId] = [];
      }
      
      documentsByDriveId[driveId].push({
        id: doc.id,
        data: data
      });
    });
    
    // Find duplicates
    let totalDuplicates = 0;
    Object.entries(documentsByDriveId).forEach(([driveId, docs]) => {
      if (docs.length > 1) {
        duplicates[driveId] = docs;
        totalDuplicates += docs.length - 1; // Count extra copies
      }
    });
    
    console.log(`\n📊 Duplicate Summary:`);
    console.log(`- Unique driveIds with duplicates: ${Object.keys(duplicates).length}`);
    console.log(`- Total duplicate documents to remove: ${totalDuplicates}\n`);
    
    // Show details of duplicates
    if (Object.keys(duplicates).length > 0) {
      console.log('📋 Duplicate Details:\n');
      
      Object.entries(duplicates).forEach(([driveId, docs]) => {
        console.log(`DriveId: ${driveId}`);
        console.log(`Number of copies: ${docs.length}`);
        
        // Show first document details
        const firstDoc = docs[0].data;
        console.log(`Title: ${firstDoc.title || 'N/A'}`);
        console.log(`Coach: ${firstDoc.coach || 'N/A'}`);
        console.log(`Student: ${firstDoc.student || 'N/A'}`);
        console.log(`Type: ${firstDoc.type || 'N/A'}`);
        
        console.log(`\nDocument IDs:`);
        docs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.id} (created: ${doc.data.createdAt?.toDate?.() || 'unknown'})`);
        });
        console.log('---\n');
      });
      
      // Special focus on Ananyaa's game plan
      console.log('🎯 Checking specifically for Ananyaa\'s game plan duplicates:\n');
      let foundAnanyaa = false;
      
      Object.entries(duplicates).forEach(([driveId, docs]) => {
        const doc = docs[0].data;
        if (doc.student && doc.student.toLowerCase().includes('ananyaa') && 
            doc.title && doc.title.toLowerCase().includes('game plan')) {
          foundAnanyaa = true;
          console.log(`Found Ananyaa's Game Plan!`);
          console.log(`DriveId: ${driveId}`);
          console.log(`Title: ${doc.title}`);
          console.log(`Number of duplicates: ${docs.length}`);
          console.log(`Document IDs:`);
          docs.forEach((d, index) => {
            console.log(`  ${index + 1}. ${d.id}`);
          });
          console.log('---\n');
        }
      });
      
      if (!foundAnanyaa) {
        // Check all documents for Ananyaa
        console.log('Checking all documents for Ananyaa entries...\n');
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.student && data.student.toLowerCase().includes('ananyaa')) {
            console.log(`Found Ananyaa document:`);
            console.log(`  ID: ${doc.id}`);
            console.log(`  Title: ${data.title}`);
            console.log(`  DriveId: ${data.driveId}`);
            console.log(`  Type: ${data.type}`);
            console.log('---');
          }
        });
      }
    } else {
      console.log('✅ No duplicates found!');
    }
    
    // Save duplicate info for removal script
    const duplicateInfo = {
      timestamp: new Date().toISOString(),
      totalDocuments: snapshot.size,
      duplicateSummary: {
        uniqueDriveIdsWithDuplicates: Object.keys(duplicates).length,
        totalDuplicatesToRemove: totalDuplicates
      },
      duplicates: duplicates
    };
    
    const fs = require('fs');
    fs.writeFileSync(
      path.join(__dirname, 'duplicates-report.json'), 
      JSON.stringify(duplicateInfo, null, 2)
    );
    console.log('\n💾 Duplicate report saved to: scripts/duplicates-report.json');
    
  } catch (error) {
    console.error('❌ Error finding duplicates:', error);
  } finally {
    // Terminate the app
    await admin.app().delete();
  }
}

// Run the script
findDuplicates();