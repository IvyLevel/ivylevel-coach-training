const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

async function testVideoQuery() {
  console.log('Testing video query...\n');
  
  const videosRef = collection(db, 'indexed_videos');
  
  // Test 1: Simple query without ordering
  try {
    console.log('Test 1: Simple query without ordering');
    const snapshot = await getDocs(videosRef);
    console.log(`✅ Found ${snapshot.size} videos\n`);
  } catch (error) {
    console.error('❌ Simple query failed:', error.message, '\n');
  }
  
  // Test 2: Query with limit
  try {
    console.log('Test 2: Query with limit(100)');
    const q = query(videosRef, limit(100));
    const snapshot = await getDocs(q);
    console.log(`✅ Found ${snapshot.size} videos\n`);
  } catch (error) {
    console.error('❌ Query with limit failed:', error.message, '\n');
  }
  
  // Test 3: Query with orderBy date
  try {
    console.log('Test 3: Query with orderBy date DESC');
    const q = query(videosRef, orderBy('date', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    console.log(`✅ Found ${snapshot.size} videos\n`);
  } catch (error) {
    console.error('❌ Query with orderBy failed:', error.message);
    console.log('This likely means you need to create an index in Firebase Console.\n');
  }
  
  // Show sample data
  console.log('Sample data from first video:');
  const sampleSnapshot = await getDocs(query(videosRef, limit(1)));
  if (!sampleSnapshot.empty) {
    const data = sampleSnapshot.docs[0].data();
    console.log(JSON.stringify(data, null, 2));
  }
  
  process.exit(0);
}

testVideoQuery();