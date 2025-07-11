// testGamePlanQuery.js - Test why Game Plan queries return 0 results
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Firebase configuration
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

async function testQueries() {
  console.log('🔍 Testing Game Plan queries...\n');
  
  try {
    // 1. Test basic connection
    console.log('1️⃣ Testing basic indexed_videos access...');
    const allVideosSnapshot = await getDocs(collection(db, 'indexed_videos'));
    console.log(`   ✅ Total documents: ${allVideosSnapshot.size}`);
    
    // 2. Count documents by category
    console.log('\n2️⃣ Counting documents by category...');
    const categories = {};
    allVideosSnapshot.forEach(doc => {
      const category = doc.data().category || 'uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    console.log('   Categories:', categories);
    
    // 3. Look for Game Plans
    console.log('\n3️⃣ Searching for Game Plan documents...');
    let gamePlans = [];
    allVideosSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.category === 'game_plan_reports' || 
          data.sessionType === 'game_plan_session' ||
          (data.title && data.title.toLowerCase().includes('gameplan'))) {
        gamePlans.push({
          id: doc.id,
          title: data.title,
          category: data.category,
          parsedStudent: data.parsedStudent,
          tags: data.tags
        });
      }
    });
    console.log(`   ✅ Found ${gamePlans.length} Game Plans`);
    if (gamePlans.length > 0) {
      console.log('   Sample Game Plans:');
      gamePlans.slice(0, 5).forEach(gp => {
        console.log(`   - ${gp.title} | Student: ${gp.parsedStudent || 'N/A'} | Category: ${gp.category}`);
      });
    }
    
    // 4. Search for Abhi/Arshiya specifically
    console.log('\n4️⃣ Searching for Abhi/Arshiya sessions...');
    let abhiSessions = [];
    allVideosSnapshot.forEach(doc => {
      const data = doc.data();
      const searchText = `${data.title || ''} ${data.parsedStudent || ''} ${(data.tags || []).join(' ')}`.toLowerCase();
      
      if (searchText.includes('abhi') || searchText.includes('arshiya')) {
        abhiSessions.push({
          id: doc.id,
          title: data.title,
          category: data.category,
          parsedStudent: data.parsedStudent,
          sessionType: data.sessionType,
          driveId: data.driveId
        });
      }
    });
    console.log(`   ✅ Found ${abhiSessions.length} Abhi/Arshiya sessions`);
    if (abhiSessions.length > 0) {
      console.log('   Sessions:');
      abhiSessions.forEach(session => {
        console.log(`   - ${session.title} | Category: ${session.category} | Type: ${session.sessionType}`);
      });
    }
    
    // 5. Test the exact query from SmartOnboardingSystem
    console.log('\n5️⃣ Testing exact SmartOnboardingSystem query...');
    const videosRef = collection(db, 'indexed_videos');
    const videosSnapshot = await getDocs(videosRef);
    
    let foundVideo = null;
    let foundReport = null;
    let totalSessions = 0;
    
    videosSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Check if this is Abhi's session
      const isAbhiSession = (
        (data.parsedStudent && (
          data.parsedStudent.toLowerCase().includes('abhi') ||
          data.parsedStudent.toLowerCase().includes('arshiya')
        )) ||
        (data.title && (
          data.title.toLowerCase().includes('abhi') ||
          data.title.toLowerCase().includes('arshiya')
        )) ||
        (data.tags && data.tags.some(tag => 
          tag.toLowerCase().includes('abhi') || 
          tag.toLowerCase().includes('arshiya')
        ))
      );
      
      if (isAbhiSession) {
        totalSessions++;
        
        // Look for Game Plan sessions
        const isGamePlan = (
          data.category === 'Game Plan' ||
          data.type === 'GamePlan' ||
          data.type === 'Game Plan' ||
          (data.category && data.category.toLowerCase().includes('game plan')) ||
          (data.title && data.title.toLowerCase().includes('game plan')) ||
          (data.tags && data.tags.some(tag => tag.toLowerCase().includes('game plan')))
        );
        
        if (isGamePlan && !foundVideo) {
          foundVideo = {
            id: doc.id,
            title: data.title,
            driveId: data.driveId,
            category: data.category
          };
        }
      }
    });
    
    console.log(`   Total Abhi sessions: ${totalSessions}`);
    console.log(`   Found Game Plan video: ${foundVideo ? 'Yes' : 'No'}`);
    if (foundVideo) {
      console.log(`   - Title: ${foundVideo.title}`);
      console.log(`   - Category: ${foundVideo.category}`);
      console.log(`   - Drive ID: ${foundVideo.driveId}`);
    }
    
    // 6. Debug category values
    console.log('\n6️⃣ Debugging category values...');
    const uniqueCategories = new Set();
    allVideosSnapshot.forEach(doc => {
      uniqueCategories.add(doc.data().category);
    });
    console.log('   Unique categories in database:', Array.from(uniqueCategories));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testQueries()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });