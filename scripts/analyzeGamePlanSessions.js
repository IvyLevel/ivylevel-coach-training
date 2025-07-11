const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function analyzeGamePlanSessions() {
  console.log('=== Analyzing Game Plan Sessions (168-hour) ===\n');
  
  try {
    // Query game plan sessions
    const snapshot = await db.collection('indexed_videos')
      .where('sessionType', '==', 'game_plan_session')
      .get();
    
    console.log(`Found ${snapshot.size} game plan sessions\n`);
    
    if (snapshot.empty) {
      // Try by category
      const categorySnapshot = await db.collection('indexed_videos')
        .where('category', '==', 'game_plan_reports')
        .get();
      
      console.log(`Found ${categorySnapshot.size} documents with category = "game_plan_reports"\n`);
      
      if (categorySnapshot.size > 0) {
        analyzeSnapshots(categorySnapshot);
      }
      return;
    }
    
    analyzeSnapshots(snapshot);
    
  } catch (error) {
    console.error('Error analyzing sessions:', error);
  } finally {
    await admin.app().delete();
  }
}

function analyzeSnapshots(snapshot) {
  // Analyze each game plan session
  snapshot.forEach((doc, index) => {
    const data = doc.data();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`GAME PLAN SESSION ${index + 1}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Document ID: ${doc.id}`);
    
    // Display all fields with their exact values
    console.log('\n--- ALL FIELDS IN DOCUMENT ---');
    const sortedKeys = Object.keys(data).sort();
    
    sortedKeys.forEach(key => {
      const value = data[key];
      const valueType = typeof value;
      
      if (value === null) {
        console.log(`  ${key}: null`);
      } else if (value === undefined) {
        console.log(`  ${key}: undefined`);
      } else if (valueType === 'string') {
        console.log(`  ${key}: "${value}"`);
      } else if (valueType === 'object') {
        if (value instanceof Date || value._seconds !== undefined) {
          console.log(`  ${key}: [timestamp]`);
        } else if (Array.isArray(value)) {
          console.log(`  ${key}: [${value}]`);
        } else {
          console.log(`  ${key}: ${JSON.stringify(value)}`);
        }
      } else {
        console.log(`  ${key}: ${value} (${valueType})`);
      }
    });
    
    // Specifically analyze coach/student fields
    console.log('\n--- COACH/STUDENT FIELD ANALYSIS ---');
    const coachStudentFields = ['coach', 'student', 'parsedCoach', 'parsedStudent', 'coachName', 'studentName'];
    
    coachStudentFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        console.log(`  ${field}: "${data[field]}" (EXISTS)`);
      } else {
        console.log(`  ${field}: NOT PRESENT IN DOCUMENT`);
      }
    });
    
    // Analyze title
    console.log('\n--- TITLE ANALYSIS ---');
    console.log(`  title: "${data.title || 'N/A'}"`);
    console.log(`  originalTitle: "${data.originalTitle || 'N/A'}"`);
    console.log(`  properTitle: "${data.properTitle || 'N/A'}"`);
    
    if (data.title) {
      const parts = data.title.split(' - ');
      console.log(`  Title split by ' - ': ${parts.length} parts`);
      parts.forEach((part, i) => {
        console.log(`    Part ${i}: "${part}"`);
      });
    }
  });
  
  // Summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  
  const fieldPresence = {};
  const uniqueValues = {
    coach: new Set(),
    student: new Set(),
    parsedCoach: new Set(),
    parsedStudent: new Set(),
    sessionType: new Set(),
    category: new Set()
  };
  
  snapshot.forEach(doc => {
    const data = doc.data();
    
    // Track field presence
    Object.keys(data).forEach(key => {
      fieldPresence[key] = (fieldPresence[key] || 0) + 1;
    });
    
    // Collect unique values
    Object.keys(uniqueValues).forEach(field => {
      if (data[field]) {
        uniqueValues[field].add(data[field]);
      }
    });
  });
  
  console.log('\nField presence across all game plan documents:');
  Object.entries(fieldPresence)
    .sort((a, b) => b[1] - a[1])
    .forEach(([field, count]) => {
      console.log(`  ${field}: ${count}/${snapshot.size} documents`);
    });
  
  console.log('\nUnique values found:');
  Object.entries(uniqueValues).forEach(([field, values]) => {
    if (values.size > 0) {
      console.log(`\n  ${field}:`);
      values.forEach(value => console.log(`    - "${value}"`));
    }
  });
}

// Run the analysis
analyzeGamePlanSessions();