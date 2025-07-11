const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function analyzeSessionTypes() {
  console.log('=== Analyzing Session Types and Categories ===\n');
  
  try {
    // Get a sample of documents
    const snapshot = await db.collection('indexed_videos')
      .limit(50)
      .get();
    
    console.log(`Analyzing ${snapshot.size} documents...\n`);
    
    const sessionTypes = {};
    const categories = {};
    const types = {};
    const titles = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Collect sessionType values
      if (data.sessionType) {
        sessionTypes[data.sessionType] = (sessionTypes[data.sessionType] || 0) + 1;
      }
      
      // Collect category values
      if (data.category) {
        categories[data.category] = (categories[data.category] || 0) + 1;
      }
      
      // Collect type values
      if (data.type) {
        types[data.type] = (types[data.type] || 0) + 1;
      }
      
      // Collect titles
      if (data.title) {
        titles.push(data.title);
      }
    });
    
    console.log('Session Types found:');
    Object.entries(sessionTypes).forEach(([type, count]) => {
      console.log(`  "${type}": ${count} documents`);
    });
    
    console.log('\nCategories found:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  "${cat}": ${count} documents`);
    });
    
    console.log('\nTypes found:');
    Object.entries(types).forEach(([type, count]) => {
      console.log(`  "${type}": ${count} documents`);
    });
    
    console.log('\nSample titles (first 10):');
    titles.slice(0, 10).forEach((title, i) => {
      console.log(`  ${i + 1}. "${title}"`);
    });
    
    // Now look specifically for game plan or 168-hour related content
    console.log('\n=== Looking for Game Plan / 168-hour content ===\n');
    
    const gamePlanSnapshot = await db.collection('indexed_videos')
      .where('category', '==', 'game-plan')
      .limit(10)
      .get();
    
    console.log(`Found ${gamePlanSnapshot.size} documents with category = "game-plan"\n`);
    
    if (gamePlanSnapshot.size > 0) {
      gamePlanSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\nGame Plan Document ${index + 1}:`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  Title: "${data.title || 'N/A'}"`);
        console.log(`  Original Title: "${data.originalTitle || 'N/A'}"`);
        console.log(`  Category: "${data.category || 'N/A'}"`);
        console.log(`  Session Type: "${data.sessionType || 'N/A'}"`);
        console.log(`  Type: "${data.type || 'N/A'}"`);
        console.log(`  Parsed Coach: "${data.parsedCoach || 'N/A'}"`);
        console.log(`  Parsed Student: "${data.parsedStudent || 'N/A'}"`);
        console.log(`  Coach: "${data.coach || 'N/A'}"`);
        console.log(`  Student: "${data.student || 'N/A'}"`);
      });
    }
    
  } catch (error) {
    console.error('Error analyzing session types:', error);
  } finally {
    await admin.app().delete();
  }
}

// Run the analysis
analyzeSessionTypes();