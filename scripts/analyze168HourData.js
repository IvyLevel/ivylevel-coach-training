const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function analyze168HourData() {
  console.log('=== Analyzing 168-Hour Sessions in indexed_videos ===\n');
  
  try {
    // Query 168-hour sessions
    const snapshot = await db.collection('indexed_videos')
      .where('sessionType', '==', '168-hour')
      .limit(20)
      .get();
    
    console.log(`Found ${snapshot.size} 168-hour sessions\n`);
    
    if (snapshot.empty) {
      // Try alternative queries
      console.log('No sessions with sessionType = "168-hour". Trying alternative queries...\n');
      
      // Try searching by title
      const titleSnapshot = await db.collection('indexed_videos')
        .limit(100)
        .get();
      
      const sessions168 = [];
      titleSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.title && data.title.toLowerCase().includes('168')) {
          sessions168.push({ id: doc.id, data });
        }
      });
      
      console.log(`Found ${sessions168.length} sessions with "168" in title\n`);
      
      if (sessions168.length > 0) {
        sessions168.slice(0, 10).forEach((session, index) => {
          analyzeSession(session.id, session.data, index + 1);
        });
      }
      
      return;
    }
    
    // Analyze each 168-hour session
    snapshot.forEach((doc, index) => {
      analyzeSession(doc.id, doc.data(), index + 1);
    });
    
    // Summary statistics
    console.log('\n=== SUMMARY STATISTICS ===\n');
    
    const fieldCounts = {};
    const coachValues = new Set();
    const studentValues = new Set();
    const parsedCoachValues = new Set();
    const parsedStudentValues = new Set();
    const sessionTypes = new Set();
    const categories = new Set();
    
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
      if (data.sessionType) sessionTypes.add(data.sessionType);
      if (data.category) categories.add(data.category);
    });
    
    console.log('Field presence across all 168-hour documents:');
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
    
    console.log('\nUnique sessionType values found:');
    sessionTypes.forEach(type => console.log(`  - "${type}"`));
    
    console.log('\nUnique category values found:');
    categories.forEach(cat => console.log(`  - "${cat}"`));
    
  } catch (error) {
    console.error('Error analyzing sessions:', error);
  } finally {
    await admin.app().delete();
  }
}

function analyzeSession(docId, data, index) {
  console.log(`\n--- Session ${index} ---`);
  console.log(`Document ID: ${docId}`);
  
  // Display key fields
  console.log('\nKey fields:');
  const keyFields = [
    'title', 'originalTitle', 'properTitle',
    'coach', 'student', 'parsedCoach', 'parsedStudent',
    'sessionType', 'category', 'type', 'week', 'parsedWeek'
  ];
  
  keyFields.forEach(field => {
    if (data.hasOwnProperty(field)) {
      console.log(`  ${field}: "${data[field]}"`);
    } else {
      console.log(`  ${field}: NOT PRESENT`);
    }
  });
  
  // Check title parsing
  console.log('\n--- Title analysis ---');
  if (data.title) {
    console.log(`  Full title: "${data.title}"`);
    
    // Try to parse the title
    const titleParts = data.title.split(' - ');
    if (titleParts.length >= 2) {
      console.log(`  Title parts: ${titleParts.length} parts`);
      titleParts.forEach((part, i) => {
        console.log(`    Part ${i + 1}: "${part}"`);
      });
    }
  }
  
  // Show all fields for debugging
  console.log('\nAll fields in document:');
  Object.keys(data).sort().forEach(key => {
    if (!keyFields.includes(key)) {
      const value = data[key];
      const valueType = typeof value;
      
      if (valueType === 'string' && value.length > 50) {
        console.log(`  ${key}: "${value.substring(0, 50)}..." (string, length: ${value.length})`);
      } else if (valueType === 'object') {
        if (value instanceof Date || value._seconds !== undefined) {
          console.log(`  ${key}: [timestamp]`);
        } else if (Array.isArray(value)) {
          console.log(`  ${key}: [Array with ${value.length} items]`);
        } else {
          console.log(`  ${key}: [object]`);
        }
      } else {
        console.log(`  ${key}: ${value} (${valueType})`);
      }
    }
  });
  
  console.log('\n' + '='.repeat(50));
}

// Run the analysis
analyze168HourData();