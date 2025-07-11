// checkGamePlanData.js - Check what Game Plan data exists for students
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
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

async function checkGamePlanData() {
  console.log('🔍 Checking Game Plan data...\n');
  
  try {
    // 1. Check for any Game Plan documents
    console.log('1️⃣ Looking for Game Plan documents...');
    const gamePlanQuery = query(collection(db, 'indexed_videos'), where('category', '==', 'game_plan_reports'));
    const gamePlanSnapshot = await getDocs(gamePlanQuery);
    
    console.log(`Found ${gamePlanSnapshot.size} Game Plan documents\n`);
    
    // 2. List all Game Plans with details
    console.log('📋 Game Plan Details:');
    gamePlanSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\nDocument ID: ${doc.id}`);
      console.log(`Title: ${data.title}`);
      console.log(`Student: ${data.parsedStudent}`);
      console.log(`Coach: ${data.parsedCoach}`);
      console.log(`Drive ID: ${data.driveId}`);
      console.log(`Category: ${data.category}`);
      console.log(`Session Type: ${data.sessionType}`);
      console.log(`Tags: ${data.tags?.join(', ')}`);
    });
    
    // 3. Check for Abhi specifically
    console.log('\n\n2️⃣ Checking for Abhi/Arshiya Game Plans...');
    const studentNames = ['Abhi', 'Arshiya'];
    
    for (const student of studentNames) {
      console.log(`\n📍 Searching for ${student}:`);
      
      // Check in parsedStudent field
      const studentQuery = query(collection(db, 'indexed_videos'), where('parsedStudent', '==', student));
      const studentSnapshot = await getDocs(studentQuery);
      
      console.log(`Total sessions for ${student}: ${studentSnapshot.size}`);
      
      let gamePlanFound = false;
      studentSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.category === 'game_plan_reports' || data.sessionType === 'game_plan_session') {
          gamePlanFound = true;
          console.log(`✅ Found Game Plan for ${student}!`);
          console.log(`   Title: ${data.title}`);
          console.log(`   Drive ID: ${data.driveId}`);
        }
      });
      
      if (!gamePlanFound) {
        console.log(`❌ No Game Plan found for ${student}`);
      }
    }
    
    // 4. Check what data the component would actually find
    console.log('\n\n3️⃣ Simulating component query (what SmartOnboardingSystem sees)...');
    const allVideos = await getDocs(collection(db, 'indexed_videos'));
    
    let foundAbhiSession = false;
    let foundGamePlan = false;
    
    allVideos.forEach(doc => {
      const data = doc.data();
      
      // Same logic as component
      const isAbhiSession = (
        (data.parsedStudent && (
          data.parsedStudent.toLowerCase().includes('abhi') ||
          data.parsedStudent.toLowerCase().includes('arshiya') ||
          data.parsedStudent === 'B'
        )) ||
        (data.title && (
          data.title.toLowerCase().includes('abhi') ||
          data.title.toLowerCase().includes('arshiya')
        ))
      );
      
      if (isAbhiSession) {
        foundAbhiSession = true;
        
        const isGamePlan = (
          data.category === 'game_plan_reports' ||
          data.sessionType === 'game_plan_session' ||
          (data.title && data.title.toLowerCase().includes('gameplan'))
        );
        
        if (isGamePlan) {
          foundGamePlan = true;
          console.log('\n✅ Component would find this Game Plan:');
          console.log(`   Title: ${data.title}`);
          console.log(`   Student: ${data.parsedStudent}`);
          console.log(`   Category: ${data.category}`);
          console.log(`   Drive ID: ${data.driveId}`);
        }
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Found Abhi/Arshiya sessions: ${foundAbhiSession}`);
    console.log(`   Found Game Plan for them: ${foundGamePlan}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkGamePlanData()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Error:', error);
    process.exit(1);
  });