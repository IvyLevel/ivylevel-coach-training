const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function listCollections() {
  console.log('=== Listing All Firestore Collections ===\n');
  
  try {
    const collections = await db.listCollections();
    
    console.log(`Found ${collections.length} collections:\n`);
    
    for (const collection of collections) {
      const snapshot = await collection.limit(5).get();
      console.log(`Collection: ${collection.id}`);
      console.log(`  Document count (first 5): ${snapshot.size}`);
      
      if (snapshot.size > 0) {
        console.log(`  Sample document IDs:`);
        snapshot.docs.forEach(doc => {
          console.log(`    - ${doc.id}`);
        });
        
        // Show fields from the first document
        const firstDoc = snapshot.docs[0];
        const data = firstDoc.data();
        console.log(`  Fields in first document:`);
        Object.keys(data).sort().forEach(key => {
          console.log(`    - ${key}`);
        });
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error listing collections:', error);
  } finally {
    await admin.app().delete();
  }
}

// Run the analysis
listCollections();