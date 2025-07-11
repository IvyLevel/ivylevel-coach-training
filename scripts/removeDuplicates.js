const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');
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

async function removeDuplicates() {
  console.log('🔍 Starting duplicate removal process...\n');
  
  try {
    // Get all indexed videos
    const snapshot = await getDocs(collection(db, 'indexed_videos'));
    console.log(`Total documents: ${snapshot.size}\n`);
    
    // Group by driveId to find duplicates
    const driveIdGroups = {};
    const filenameGroups = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const driveId = data.driveId;
      const filename = data.filename;
      
      // Group by driveId
      if (driveId) {
        if (!driveIdGroups[driveId]) {
          driveIdGroups[driveId] = [];
        }
        driveIdGroups[driveId].push({ id: doc.id, ...data });
      } else if (filename) {
        // If no driveId, group by filename
        if (!filenameGroups[filename]) {
          filenameGroups[filename] = [];
        }
        filenameGroups[filename].push({ id: doc.id, ...data });
      }
    });
    
    // Find documents to delete (keep the first one, delete the rest)
    const toDelete = [];
    
    // Process driveId duplicates
    for (const [driveId, docs] of Object.entries(driveIdGroups)) {
      if (docs.length > 1) {
        console.log(`Found ${docs.length} duplicates for Drive ID: ${driveId}`);
        console.log(`  Keeping: ${docs[0].filename} (ID: ${docs[0].id})`);
        
        // Keep the first one, mark others for deletion
        for (let i = 1; i < docs.length; i++) {
          toDelete.push(docs[i].id);
          console.log(`  Deleting: ${docs[i].filename} (ID: ${docs[i].id})`);
        }
        console.log('');
      }
    }
    
    // Process filename duplicates (only for those without driveId)
    for (const [filename, docs] of Object.entries(filenameGroups)) {
      // Only process if all docs in this group have no driveId
      const allNoDriveId = docs.every(doc => !doc.driveId);
      if (allNoDriveId && docs.length > 1) {
        console.log(`Found ${docs.length} duplicates for filename: ${filename} (no Drive ID)`);
        console.log(`  Keeping: ID: ${docs[0].id}`);
        
        // Keep the first one, mark others for deletion
        for (let i = 1; i < docs.length; i++) {
          if (!toDelete.includes(docs[i].id)) {
            toDelete.push(docs[i].id);
            console.log(`  Deleting: ID: ${docs[i].id}`);
          }
        }
        console.log('');
      }
    }
    
    if (toDelete.length === 0) {
      console.log('✅ No duplicates found to remove!');
      process.exit(0);
    }
    
    // Confirm before deletion
    console.log(`\n⚠️  Found ${toDelete.length} duplicate documents to delete.`);
    console.log('\nThis script is in DRY RUN mode. To actually delete duplicates, uncomment the deletion code below.\n');
    
    // UNCOMMENT THE FOLLOWING LINES TO ACTUALLY DELETE DUPLICATES
    /*
    console.log('Starting deletion...\n');
    
    for (const docId of toDelete) {
      try {
        await deleteDoc(doc(db, 'indexed_videos', docId));
        console.log(`✓ Deleted document: ${docId}`);
      } catch (error) {
        console.error(`✗ Failed to delete document ${docId}:`, error.message);
      }
    }
    
    console.log(`\n✅ Deletion complete! Removed ${toDelete.length} duplicate documents.`);
    */
    
    console.log('To proceed with deletion, edit this script and uncomment the deletion code.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeDuplicates();