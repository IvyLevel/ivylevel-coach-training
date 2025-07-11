const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function analyze168HourSessions() {
  console.log('=== Analyzing 168-Hour Sessions ===\n');
  
  try {
    // Query all 168-hour sessions
    const snapshot = await db.collection('168-hour')
      .orderBy('timestamp', 'desc')
      .limit(20) // Get the most recent 20 sessions
      .get();
    
    console.log(`Found ${snapshot.size} recent 168-hour sessions\n`);
    
    if (snapshot.empty) {
      console.log('No 168-hour sessions found in the database.');
      return;
    }
    
    // Analyze each session
    snapshot.forEach((doc, index) => {
      console.log(`\n--- Session ${index + 1} ---`);
      console.log(`Document ID: ${doc.id}`);
      
      const data = doc.data();
      
      // Display all fields with their values
      console.log('\nAll fields in document:');
      Object.keys(data).sort().forEach(key => {
        const value = data[key];
        const valueType = typeof value;
        
        if (value === null) {
          console.log(`  ${key}: null`);
        } else if (value === undefined) {
          console.log(`  ${key}: undefined`);
        } else if (valueType === 'string') {
          // Truncate long strings for readability
          const displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
          console.log(`  ${key}: "${displayValue}" (string, length: ${value.length})`);
        } else if (valueType === 'object') {
          if (value instanceof Date || value._seconds !== undefined) {
            console.log(`  ${key}: ${value} (timestamp)`);
          } else if (Array.isArray(value)) {
            console.log(`  ${key}: [Array with ${value.length} items]`);
          } else {
            console.log(`  ${key}: ${JSON.stringify(value)} (object)`);
          }
        } else {
          console.log(`  ${key}: ${value} (${valueType})`);
        }
      });
      
      // Specifically check for coach-related fields
      console.log('\n--- Coach-related fields analysis ---');
      const coachFields = ['coach', 'parsedCoach', 'coachName', 'student', 'parsedStudent', 'studentName'];
      coachFields.forEach(field => {
        if (data.hasOwnProperty(field)) {
          console.log(`  ${field}: "${data[field]}"`);
        } else {
          console.log(`  ${field}: NOT PRESENT`);
        }
      });
      
      // Check title field
      console.log('\n--- Title analysis ---');
      if (data.title) {
        console.log(`  Original title: "${data.title}"`);
        
        // Try to parse the title
        const titleParts = data.title.split(' - ');
        if (titleParts.length >= 2) {
          console.log(`  Title parts: ${titleParts.length} parts`);
          console.log(`  Part 1: "${titleParts[0]}"`);
          console.log(`  Part 2: "${titleParts[1]}"`);
          if (titleParts.length > 2) {
            console.log(`  Remaining parts: "${titleParts.slice(2).join(' - ')}"`);
          }
        }
      } else {
        console.log('  Title: NOT PRESENT');
      }
      
      // Check timestamp
      console.log('\n--- Timestamp ---');
      if (data.timestamp) {
        const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        console.log(`  Timestamp: ${date.toISOString()}`);
      }
      
      console.log('\n' + '='.repeat(50));
    });
    
    // Summary statistics
    console.log('\n=== SUMMARY STATISTICS ===\n');
    
    const fieldCounts = {};
    const coachValues = new Set();
    const studentValues = new Set();
    const parsedCoachValues = new Set();
    const parsedStudentValues = new Set();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Count fields
      Object.keys(data).forEach(key => {
        fieldCounts[key] = (fieldCounts[key] || 0) + 1;
      });
      
      // Collect unique values
      if (data.coach) coachValues.add(data.coach);
      if (data.student) studentValues.add(data.student);
      if (data.parsedCoach) parsedCoachValues.add(data.parsedCoach);
      if (data.parsedStudent) parsedStudentValues.add(data.parsedStudent);
    });
    
    console.log('Field presence across all documents:');
    Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([field, count]) => {
        console.log(`  ${field}: ${count}/${snapshot.size} documents (${Math.round(count/snapshot.size * 100)}%)`);
      });
    
    console.log('\nUnique coach values found:');
    coachValues.forEach(coach => console.log(`  - "${coach}"`));
    
    console.log('\nUnique student values found:');
    studentValues.forEach(student => console.log(`  - "${student}"`));
    
    console.log('\nUnique parsedCoach values found:');
    parsedCoachValues.forEach(coach => console.log(`  - "${coach}"`));
    
    console.log('\nUnique parsedStudent values found:');
    parsedStudentValues.forEach(student => console.log(`  - "${student}"`));
    
  } catch (error) {
    console.error('Error analyzing sessions:', error);
  } finally {
    await admin.app().delete();
  }
}

// Run the analysis
analyze168HourSessions();