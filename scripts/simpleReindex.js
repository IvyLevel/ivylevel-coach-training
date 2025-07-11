// simpleReindex.js - Simple reindexing without backup creation
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
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

// Simplified category mapping
function getCategoryFromTitle(title, tags) {
  const titleLower = (title || '').toLowerCase();
  const tagsStr = (tags || []).join(' ').toLowerCase();
  
  // Game Plan categorization
  if (titleLower.includes('game plan') || tagsStr.includes('game plan') ||
      titleLower.includes('gameplan') || tagsStr.includes('gameplan')) {
    return 'game_plan_reports';
  }
  
  // Execution docs
  if (titleLower.includes('execution') || tagsStr.includes('execution') ||
      titleLower.includes('action items') || tagsStr.includes('follow up')) {
    return 'execution_documents';
  }
  
  // Coach resources
  if (titleLower.includes('training') || titleLower.includes('guideline') ||
      titleLower.includes('template') || tagsStr.includes('coach resource')) {
    return 'coach_resources';
  }
  
  // Default to student sessions for regular coaching
  return 'student_sessions';
}

// Parse student name from title
function parseStudentName(title, parsedStudent) {
  if (parsedStudent) return parsedStudent;
  
  // Try to extract from title patterns like "Coach & Student - Week XX"
  const pattern1 = /[A-Za-z]+\s*&\s*([A-Za-z]+)\s*-/;
  const pattern2 = /^([A-Za-z]+)\s*-/;
  
  const match1 = title.match(pattern1);
  if (match1) return match1[1];
  
  const match2 = title.match(pattern2);
  if (match2) return match2[1];
  
  return null;
}

async function reindexDocuments() {
  console.log('🔄 Starting simple reindexing...\n');
  
  try {
    // Fetch all documents
    const videosRef = collection(db, 'indexed_videos');
    const snapshot = await getDocs(videosRef);
    
    console.log(`📊 Found ${snapshot.size} documents to process\n`);
    
    let processed = 0;
    let updated = 0;
    let gamePlanCount = 0;
    let errors = 0;
    
    // Process each document individually
    for (const docSnapshot of snapshot.docs) {
      try {
        const data = docSnapshot.data();
        const docId = docSnapshot.id;
        
        // Skip if already properly categorized (not "General Coaching")
        if (data.category && data.category !== 'General Coaching') {
          processed++;
          continue;
        }
        
        // Determine new category
        const newCategory = getCategoryFromTitle(data.title, data.tags);
        
        // Parse student name if missing
        const studentName = parseStudentName(data.title, data.parsedStudent);
        
        // Prepare update data
        const updateData = {
          category: newCategory,
          reindexedAt: new Date().toISOString(),
          dataVersion: '2.0'
        };
        
        // Add student name if found
        if (studentName && !data.parsedStudent) {
          updateData.parsedStudent = studentName;
        }
        
        // Check if this is a Game Plan session
        if (newCategory === 'game_plan_reports') {
          gamePlanCount++;
          updateData.sessionType = 'game_plan_session';
          console.log(`📋 Found Game Plan: ${data.title}`);
        }
        
        // Update the document
        const docRef = doc(db, 'indexed_videos', docId);
        await updateDoc(docRef, updateData);
        
        updated++;
        processed++;
        
        if (processed % 50 === 0) {
          console.log(`📈 Progress: ${processed}/${snapshot.size} documents processed`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing document ${docSnapshot.id}:`, error.message);
        errors++;
        processed++;
      }
    }
    
    console.log('\n✅ Reindexing Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total documents: ${snapshot.size}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Game Plans found: ${gamePlanCount}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Already categorized: ${snapshot.size - updated - errors}`);
    
    // Show category distribution
    console.log('\n📊 Checking new category distribution...');
    const updatedSnapshot = await getDocs(videosRef);
    const categories = {};
    
    updatedSnapshot.forEach(doc => {
      const category = doc.data().category || 'uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    console.log('\n📊 Category Distribution:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
    
    return { success: true, updated, errors };
    
  } catch (error) {
    console.error('❌ Reindexing failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the reindexing
if (require.main === module) {
  reindexDocuments()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Success! Your data has been reindexed.');
        console.log('\n🎯 Next steps:');
        console.log('1. Check Smart Onboarding to see if Abhi\'s Game Plan appears');
        console.log('2. Look for sessions categorized as "game_plan_reports"');
        console.log('3. Verify student names are properly parsed');
        process.exit(0);
      } else {
        console.error('\n💥 Reindexing failed.');
        process.exit(1);
      }
    });
}

module.exports = { reindexDocuments };