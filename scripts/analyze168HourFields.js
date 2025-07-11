const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyze168HourFields() {
  console.log('Analyzing all sessions to find 168-hour related fields...\n');
  
  try {
    // Get all sessions
    const snapshot = await db.collection('sessions').limit(50).get();
    
    console.log(`Analyzing ${snapshot.size} sample documents...\n`);
    
    // Track all unique fields across documents
    const allFields = new Set();
    const fieldOccurrences = {};
    
    // Look for 168-hour sessions based on title or other indicators
    const potential168Sessions = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Collect all fields
      Object.keys(data).forEach(field => {
        allFields.add(field);
        fieldOccurrences[field] = (fieldOccurrences[field] || 0) + 1;
      });
      
      // Check if this might be a 168-hour session based on various indicators
      const title = data.title || '';
      const filename = data.filename || '';
      const sessionType = data.sessionType || '';
      const transcript = data.transcript || '';
      
      const is168Hour = 
        title.includes('168') ||
        filename.includes('168') ||
        sessionType.includes('168') ||
        transcript.toLowerCase().includes('168 hour') ||
        transcript.toLowerCase().includes('168-hour') ||
        data.is168Hour === true ||
        data.is168HourSession === true ||
        data.type === '168hour' ||
        data.sessionCategory === '168hour';
      
      if (is168Hour) {
        potential168Sessions.push({
          id: doc.id,
          title: data.title,
          filename: data.filename,
          parsedCoach: data.parsedCoach,
          parsedStudent: data.parsedStudent,
          sessionType: data.sessionType,
          type: data.type,
          sessionCategory: data.sessionCategory,
          is168Hour: data.is168Hour,
          is168HourSession: data.is168HourSession
        });
      }
    });
    
    // Display all fields found
    console.log('All fields found in sessions collection:');
    console.log('=' .repeat(50));
    const sortedFields = Array.from(allFields).sort();
    sortedFields.forEach(field => {
      const percentage = (fieldOccurrences[field] / snapshot.size * 100).toFixed(1);
      console.log(`${field}: ${fieldOccurrences[field]} docs (${percentage}%)`);
    });
    
    // Display potential 168-hour sessions
    console.log('\n\nPotential 168-hour sessions found:');
    console.log('=' .repeat(80));
    
    if (potential168Sessions.length === 0) {
      console.log('No 168-hour sessions found in this sample.');
    } else {
      potential168Sessions.forEach(session => {
        console.log(`\nDocument ID: ${session.id}`);
        console.log(`Title: ${session.title || 'No title'}`);
        console.log(`Filename: ${session.filename || 'No filename'}`);
        console.log(`Parsed Coach: ${session.parsedCoach || 'No coach'}`);
        console.log(`Parsed Student: ${session.parsedStudent || 'No student'}`);
        console.log(`Session Type: ${session.sessionType || 'Not set'}`);
        console.log(`Type: ${session.type || 'Not set'}`);
        console.log(`Session Category: ${session.sessionCategory || 'Not set'}`);
        console.log(`is168Hour: ${session.is168Hour}`);
        console.log(`is168HourSession: ${session.is168HourSession}`);
        console.log('-'.repeat(80));
      });
    }
    
    // Now let's specifically search for 168 in titles
    console.log('\n\nSearching for "168" in titles across all documents...');
    console.log('=' .repeat(50));
    
    const titleSnapshot = await db.collection('sessions')
      .where('title', '>=', '168')
      .where('title', '<', '169')
      .get();
    
    console.log(`Found ${titleSnapshot.size} documents with "168" at the start of title`);
    
    // Also search in transcript for 168-hour mentions
    console.log('\nChecking a broader sample for 168-hour mentions...');
    const broaderSnapshot = await db.collection('sessions').limit(200).get();
    
    let count168Mentions = 0;
    const sessions168 = [];
    
    broaderSnapshot.forEach(doc => {
      const data = doc.data();
      const transcript = (data.transcript || '').toLowerCase();
      const title = (data.title || '').toLowerCase();
      const filename = (data.filename || '').toLowerCase();
      
      if (transcript.includes('168 hour') || transcript.includes('168-hour') || 
          title.includes('168') || filename.includes('168')) {
        count168Mentions++;
        sessions168.push({
          id: doc.id,
          title: data.title,
          filename: data.filename,
          parsedCoach: data.parsedCoach,
          parsedStudent: data.parsedStudent
        });
      }
    });
    
    console.log(`\nFound ${count168Mentions} documents mentioning "168 hour" in broader sample`);
    
    if (sessions168.length > 0) {
      console.log('\nFirst 10 sessions mentioning 168-hour:');
      sessions168.slice(0, 10).forEach(session => {
        console.log(`- ${session.title || session.filename} | Coach: ${session.parsedCoach} | Student: ${session.parsedStudent}`);
      });
    }
    
  } catch (error) {
    console.error('Error analyzing sessions:', error);
  } finally {
    // Close the connection
    await admin.app().delete();
  }
}

// Run the analysis
analyze168HourFields();