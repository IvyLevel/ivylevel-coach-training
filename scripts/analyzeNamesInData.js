// analyzeNamesInData.js - Analyze all names in the data to understand coaches vs students
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

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

async function analyzeNames() {
  console.log('🔍 Analyzing names in your data...\n');
  
  const snapshot = await getDocs(collection(db, 'indexed_videos'));
  
  const names = new Set();
  const titlePatterns = [];
  const folderPaths = new Set();
  const parsedStudents = new Set();
  const parsedCoaches = new Set();
  
  // Collect all data
  snapshot.forEach(doc => {
    const data = doc.data();
    
    // Collect parsed fields
    if (data.parsedStudent) parsedStudents.add(data.parsedStudent);
    if (data.parsedCoach) parsedCoaches.add(data.parsedCoach);
    
    // Collect folder paths
    if (data.folderPath) folderPaths.add(data.folderPath);
    
    // Analyze title patterns
    if (data.title) {
      titlePatterns.push(data.title);
      
      // Extract names from patterns like "Name1 & Name2"
      const match = data.title.match(/^(\w+)\s*&\s*(\w+)/);
      if (match) {
        names.add(match[1]);
        names.add(match[2]);
      }
    }
  });
  
  console.log('📊 Analysis Results:\n');
  
  console.log('1️⃣ Currently parsed students:', Array.from(parsedStudents).sort());
  console.log('\n2️⃣ Currently parsed coaches:', Array.from(parsedCoaches).sort());
  console.log('\n3️⃣ All names found in titles:', Array.from(names).sort());
  
  console.log('\n4️⃣ Sample folder paths:');
  Array.from(folderPaths).slice(0, 10).forEach(path => {
    console.log(`   ${path}`);
  });
  
  console.log('\n5️⃣ Title pattern analysis:');
  const patternCounts = {};
  
  titlePatterns.forEach(title => {
    // Identify patterns
    if (title.match(/^Gameplan & [A-C] -/)) {
      patternCounts['Gameplan & [Source] - Week X'] = (patternCounts['Gameplan & [Source] - Week X'] || 0) + 1;
    } else if (title.match(/^[A-C] & \w+ -/)) {
      patternCounts['[Source] & [Name] - Week X'] = (patternCounts['[Source] & [Name] - Week X'] || 0) + 1;
    } else if (title.match(/^\w+ & \w+ - Week/)) {
      patternCounts['[Name] & [Name] - Week X'] = (patternCounts['[Name] & [Name] - Week X'] || 0) + 1;
    } else if (title.includes('Quick Check-in')) {
      patternCounts['Quick Check-in'] = (patternCounts['Quick Check-in'] || 0) + 1;
    } else {
      patternCounts['Other'] = (patternCounts['Other'] || 0) + 1;
    }
  });
  
  Object.entries(patternCounts).forEach(([pattern, count]) => {
    console.log(`   ${pattern}: ${count} occurrences`);
  });
  
  console.log('\n6️⃣ Detecting likely coaches vs students:');
  
  // Analyze who appears with whom
  const relationships = {};
  titlePatterns.forEach(title => {
    const match = title.match(/^(\w+)\s*&\s*(\w+)\s*-/);
    if (match && match[1] !== 'A' && match[1] !== 'B' && match[1] !== 'C' && 
        match[2] !== 'A' && match[2] !== 'B' && match[2] !== 'C') {
      const key = `${match[1]} & ${match[2]}`;
      relationships[key] = (relationships[key] || 0) + 1;
    }
  });
  
  console.log('\n   Common pairings:');
  Object.entries(relationships)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([pair, count]) => {
      console.log(`   ${pair}: ${count} sessions`);
    });
  
  // Identify who appears more often in first position (likely coaches)
  const firstPositionCount = {};
  const secondPositionCount = {};
  
  titlePatterns.forEach(title => {
    const match = title.match(/^(\w+)\s*&\s*(\w+)\s*-/);
    if (match && match[1] !== 'A' && match[1] !== 'B' && match[1] !== 'C') {
      firstPositionCount[match[1]] = (firstPositionCount[match[1]] || 0) + 1;
    }
    if (match && match[2] !== 'A' && match[2] !== 'B' && match[2] !== 'C') {
      secondPositionCount[match[2]] = (secondPositionCount[match[2]] || 0) + 1;
    }
  });
  
  console.log('\n7️⃣ Names by position frequency:');
  console.log('\n   Appears in FIRST position (likely coaches):');
  Object.entries(firstPositionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([name, count]) => {
      console.log(`   ${name}: ${count} times`);
    });
    
  console.log('\n   Appears in SECOND position (likely students):');
  Object.entries(secondPositionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([name, count]) => {
      console.log(`   ${name}: ${count} times`);
    });
}

analyzeNames()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Error:', error);
    process.exit(1);
  });