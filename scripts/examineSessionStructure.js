const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function examineSessionStructure() {
  console.log('Examining session document structure...\n');
  
  try {
    // Get a few sample documents to see their full structure
    const snapshot = await db.collection('sessions').limit(5).get();
    
    console.log(`Found ${snapshot.size} documents. Examining their structure:\n`);
    
    let docIndex = 1;
    snapshot.forEach(doc => {
      console.log(`\nDocument ${docIndex} (ID: ${doc.id}):`);
      console.log('=' .repeat(80));
      
      const data = doc.data();
      
      // Display all fields and their values
      Object.entries(data).forEach(([field, value]) => {
        if (field === 'transcript' && value) {
          // For transcript, just show length and first 200 chars
          console.log(`${field}: [Transcript of ${value.length} characters]`);
          console.log(`  First 200 chars: "${value.substring(0, 200)}..."`);
        } else if (value instanceof Date || (value && value._seconds)) {
          // Handle date fields
          console.log(`${field}: ${value instanceof Date ? value.toISOString() : new Date(value._seconds * 1000).toISOString()}`);
        } else if (typeof value === 'object' && value !== null) {
          console.log(`${field}: ${JSON.stringify(value, null, 2)}`);
        } else {
          console.log(`${field}: ${value}`);
        }
      });
      
      docIndex++;
    });
    
    // Now let's check the heroCoaches collection to understand the data model
    console.log('\n\nChecking heroCoaches collection structure...');
    console.log('=' .repeat(80));
    
    const heroSnapshot = await db.collection('heroCoaches').limit(3).get();
    
    if (!heroSnapshot.empty) {
      console.log(`Found ${heroSnapshot.size} hero coaches:\n`);
      
      heroSnapshot.forEach(doc => {
        console.log(`\nCoach ID: ${doc.id}`);
        const coachData = doc.data();
        console.log(`Name: ${coachData.name}`);
        
        // Check if there's a sessions subcollection
        console.log('Checking for subcollections...');
      });
      
      // Try to access sessions subcollection
      const firstCoach = heroSnapshot.docs[0];
      if (firstCoach) {
        const sessionsSubcollection = await db.collection('heroCoaches')
          .doc(firstCoach.id)
          .collection('sessions')
          .limit(3)
          .get();
        
        if (!sessionsSubcollection.empty) {
          console.log(`\n\nFound ${sessionsSubcollection.size} sessions in ${firstCoach.id}'s subcollection:`);
          
          sessionsSubcollection.forEach(sessionDoc => {
            const sessionData = sessionDoc.data();
            console.log(`\nSession: ${sessionDoc.id}`);
            console.log(`Title: ${sessionData.title || 'No title'}`);
            console.log(`Type: ${sessionData.type || 'No type'}`);
            console.log(`Filename: ${sessionData.filename || 'No filename'}`);
            
            // Check for any 168-hour indicators
            const transcript = (sessionData.transcript || '').toLowerCase();
            if (transcript.includes('168') || (sessionData.title || '').includes('168')) {
              console.log('*** This session mentions 168-hour! ***');
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error examining session structure:', error);
  } finally {
    // Close the connection
    await admin.app().delete();
  }
}

// Run the examination
examineSessionStructure();