// testFirebaseConnection.js - Test Firebase connection
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('✅ Environment file loaded from .env.local');
} else {
  // Try .env.production as fallback
  const prodEnvPath = path.join(__dirname, '..', '.env.production');
  if (fs.existsSync(prodEnvPath)) {
    require('dotenv').config({ path: prodEnvPath });
    console.log('✅ Environment file loaded from .env.production');
  } else {
    console.log('❌ No environment file found');
  }
}

// Check environment variables
console.log('\n📋 Environment Variables Check:');
console.log('API Key:', process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Found' : '❌ Missing');
console.log('Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Found' : '❌ Missing');
console.log('Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Found' : '❌ Missing');
console.log('Storage Bucket:', process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ Found' : '❌ Missing');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

console.log('\n🔥 Firebase Config:');
console.log('Project ID:', firebaseConfig.projectId);

async function testConnection() {
  try {
    console.log('\n🔄 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('📥 Testing Firestore connection...');
    
    // Try to fetch a few documents from indexed_videos
    const videosRef = collection(db, 'indexed_videos');
    const q = query(videosRef, limit(5));
    const snapshot = await getDocs(q);
    
    console.log(`✅ Connection successful! Found ${snapshot.size} documents`);
    
    // Show sample data
    if (snapshot.size > 0) {
      console.log('\n📊 Sample documents:');
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. Document ID: ${doc.id}`);
        console.log(`   Title: ${data.title || 'N/A'}`);
        console.log(`   Category: ${data.category || 'N/A'}`);
        console.log(`   Parsed Student: ${data.parsedStudent || 'N/A'}`);
        console.log(`   Tags: ${data.tags ? data.tags.join(', ') : 'N/A'}`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'invalid-argument') {
      console.log('\n💡 This error usually means:');
      console.log('1. Invalid Firebase project configuration');
      console.log('2. Missing or incorrect environment variables');
      console.log('3. Firebase project doesn\'t exist or is misconfigured');
    }
    
    return false;
  }
}

// Run test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Firebase connection test passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Firebase connection test failed!');
      process.exit(1);
    }
  });