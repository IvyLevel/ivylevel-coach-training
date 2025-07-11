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

async function check168Sessions() {
  console.log('🔍 Checking 168-hour sessions in indexed_videos...\n');
  
  const snapshot = await db.collection('indexed_videos')
    .where('is168HourSession', '==', true)
    .get();
  
  console.log(`Found ${snapshot.size} 168-hour sessions:\n`);
  
  let issueCount = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const coach = data.parsedCoach || data.coach || 'Not set';
    
    // Check if coach is a single letter
    if (coach === 'A' || coach === 'B' || coach === 'C') {
      issueCount++;
      console.log(`❌ ISSUE - Title: ${data.title}`);
      console.log(`  Coach: "${coach}" (should be actual name)`);
      console.log(`  Student: ${data.parsedStudent || data.student || 'Not set'}`);
      console.log(`  Filename: ${data.filename}`);
      console.log('---');
    } else {
      console.log(`✅ Title: ${data.title}`);
      console.log(`  Coach: ${coach}`);
      console.log(`  Student: ${data.parsedStudent || data.student || 'Not set'}`);
      console.log('---');
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`Total 168-hour sessions: ${snapshot.size}`);
  console.log(`Sessions with coach name issues: ${issueCount}`);
  
  process.exit(0);
}

check168Sessions().catch(console.error);