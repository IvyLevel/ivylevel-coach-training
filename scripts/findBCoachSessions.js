const admin = require('firebase-admin');
const path = require('path');

// Initialize Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function findBCoachSessions() {
  console.log('🔍 Looking for sessions with "B &" in titles...\n');
  
  const snapshot = await db.collection('indexed_videos')
    .orderBy('uploadDate', 'desc')
    .get();
  
  let count = 0;
  const dataSourcePatterns = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const title = data.title || data.originalTitle || '';
    const filename = data.filename || '';
    
    // Check if title contains data source patterns
    if (title.includes('B & ') || title.includes('A & ') || title.includes('C & ')) {
      count++;
      if (count <= 10) {
        console.log(`📄 Title: ${title}`);
        console.log(`  Coach: ${data.parsedCoach || data.coach || 'Not set'}`);
        console.log(`  Student: ${data.parsedStudent || data.student || 'Not set'}`);
        console.log(`  Category: ${data.category}`);
        console.log(`  Filename: ${filename}`);
        console.log('---');
      }
      dataSourcePatterns.push(title);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`Total sessions with "A/B/C &" in title: ${count}`);
  
  if (count > 10) {
    console.log(`\nShowing first 10 of ${count} sessions. All affected titles:`);
    console.log(dataSourcePatterns.slice(0, 20).join('\n'));
  }
  
  process.exit(0);
}

findBCoachSessions().catch(console.error);