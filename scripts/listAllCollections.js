const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listAllCollections() {
  console.log('Listing all collections in the database...\n');
  
  try {
    // Get all collections
    const collections = await db.listCollections();
    
    console.log(`Found ${collections.length} collections:\n`);
    
    for (const collection of collections) {
      console.log(`\nCollection: ${collection.id}`);
      console.log('-'.repeat(50));
      
      // Get document count and sample
      const snapshot = await collection.limit(5).get();
      console.log(`Document count (sample): ${snapshot.size}`);
      
      if (!snapshot.empty) {
        // Show sample document structure
        const firstDoc = snapshot.docs[0];
        const data = firstDoc.data();
        
        console.log(`Sample document ID: ${firstDoc.id}`);
        console.log('Fields in document:');
        Object.keys(data).forEach(field => {
          let value = data[field];
          if (field === 'transcript' && value) {
            value = `[Transcript of ${value.length} characters]`;
          } else if (value instanceof Date || (value && value._seconds)) {
            value = value instanceof Date ? value.toISOString() : new Date(value._seconds * 1000).toISOString();
          } else if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
          }
          console.log(`  - ${field}: ${value}`);
        });
        
        // Check if this document has subcollections
        try {
          const subcollections = await firstDoc.ref.listCollections();
          if (subcollections.length > 0) {
            console.log(`\nSubcollections in this document:`);
            subcollections.forEach(sub => {
              console.log(`  - ${sub.id}`);
            });
          }
        } catch (e) {
          // Ignore subcollection errors
        }
      }
    }
    
    // Let's also check if there's any data that looks like coaching sessions
    console.log('\n\n' + '='.repeat(80));
    console.log('SEARCHING FOR COACHING SESSION DATA PATTERNS');
    console.log('='.repeat(80));
    
    for (const collection of collections) {
      const snapshot = await collection.limit(100).get();
      
      let hasCoachingData = false;
      let sample168Session = null;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Check various fields that might indicate coaching sessions
        if (data.transcript || data.parsedCoach || data.parsedStudent || 
            data.title || data.filename || data.sessionType) {
          hasCoachingData = true;
        }
        
        // Check for 168-hour mentions
        const searchText = JSON.stringify(data).toLowerCase();
        if (searchText.includes('168')) {
          sample168Session = {
            collection: collection.id,
            docId: doc.id,
            data: data
          };
        }
      });
      
      if (hasCoachingData) {
        console.log(`\n✓ Collection "${collection.id}" appears to contain coaching session data`);
        
        if (sample168Session) {
          console.log(`  Found 168-hour related content in document: ${sample168Session.docId}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error listing collections:', error);
  } finally {
    // Close the connection
    await admin.app().delete();
  }
}

// Run the listing
listAllCollections();