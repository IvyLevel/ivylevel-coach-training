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

async function findUnknownRishi() {
  console.log('🔍 Looking for sessions where Rishi might be showing as Unknown...\n');
  
  // Search for specific date you mentioned: 2025-07-07
  const snapshot = await db.collection('indexed_videos')
    .orderBy('uploadDate', 'desc')
    .limit(1000)
    .get();
  
  console.log('Looking for the session: Unknown & Aaryan - Week 01 (2025-07-07)');
  console.log('Expected filename: Coaching_B_Rishi_Aaryan_Wk01_2024-05-09_M_a76329e64284b419U_a76329e64284b419\n');
  
  let found = false;
  snapshot.forEach(doc => {
    const data = doc.data();
    const filename = data.filename || '';
    
    // Look for the specific filename pattern you mentioned
    if (filename.includes('a76329e64284b419')) {
      found = true;
      console.log('FOUND THE SESSION!');
      console.log('Document ID:', doc.id);
      console.log('Title:', data.title || data.originalTitle);
      console.log('Filename:', filename);
      console.log('Database Coach:', data.parsedCoach || data.coach || 'NOT SET');
      console.log('Database Student:', data.parsedStudent || data.student || 'NOT SET');
      console.log('Category:', data.category);
      console.log('Upload Date:', data.uploadDate);
      console.log('Session Date:', data.sessionDate);
      console.log('\nFull data:', JSON.stringify(data, null, 2));
    }
  });
  
  if (!found) {
    console.log('Could not find the session with filename containing "a76329e64284b419"');
    
    // Let's look for any session with date 2025-07-07
    console.log('\n\nLooking for sessions with date containing 2025-07-07...');
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = data.title || data.originalTitle || '';
      const sessionDate = data.sessionDate || '';
      const uploadDate = data.uploadDate || '';
      
      if (title.includes('2025-07-07') || sessionDate.includes('2025-07-07') || uploadDate.includes('2025-07-07')) {
        console.log('\nFound session with date 2025-07-07:');
        console.log('Title:', title);
        console.log('Filename:', data.filename);
        console.log('Coach:', data.parsedCoach || data.coach);
        console.log('Student:', data.parsedStudent || data.student);
      }
    });
  }
  
  process.exit(0);
}

findUnknownRishi().catch(console.error);