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

async function analyzeVideoData() {
  console.log('🔍 Analyzing video data structure...\n');
  
  const snapshot = await db.collection('indexed_videos').limit(20).get();
  
  console.log('📊 Sample Video Data:\n');
  
  snapshot.forEach((doc, index) => {
    const data = doc.data();
    console.log(`\n--- Video ${index + 1} ---`);
    console.log('ID:', doc.id);
    console.log('Title:', data.title || 'N/A');
    console.log('Original Title:', data.originalTitle || 'N/A');
    console.log('Proper Title:', data.properTitle || 'N/A');
    console.log('Filename:', data.filename || 'N/A');
    console.log('Folder Path:', data.folderPath || 'N/A');
    console.log('Coach:', data.coach || 'N/A');
    console.log('Parsed Coach:', data.parsedCoach || 'N/A');
    console.log('Student:', data.student || 'N/A');
    console.log('Parsed Student:', data.parsedStudent || 'N/A');
    console.log('Category:', data.category || 'N/A');
    console.log('Data Source:', data.dataSource || 'N/A');
    console.log('Session Type:', data.sessionType || 'N/A');
  });
  
  // Analyze categories
  console.log('\n\n📂 Category Distribution:');
  const allDocs = await db.collection('indexed_videos').get();
  const categories = {};
  const folderPaths = {};
  const unknownCoaches = [];
  
  allDocs.forEach(doc => {
    const data = doc.data();
    const category = data.category || 'uncategorized';
    categories[category] = (categories[category] || 0) + 1;
    
    // Track folder paths
    if (data.folderPath) {
      const rootFolder = data.folderPath.split('/')[0];
      folderPaths[rootFolder] = (folderPaths[rootFolder] || 0) + 1;
    }
    
    // Track unknowns
    if (data.parsedCoach === 'Unknown' || data.coach === 'Unknown' || !data.parsedCoach) {
      unknownCoaches.push({
        title: data.title || data.originalTitle,
        folderPath: data.folderPath,
        filename: data.filename
      });
    }
  });
  
  console.log('\nCategories:', categories);
  console.log('\nRoot Folders:', folderPaths);
  console.log(`\nVideos with Unknown Coach: ${unknownCoaches.length}`);
  
  if (unknownCoaches.length > 0) {
    console.log('\nSample Unknown Coach Videos:');
    unknownCoaches.slice(0, 5).forEach(video => {
      console.log(`- ${video.title}`);
      console.log(`  Path: ${video.folderPath}`);
      console.log(`  File: ${video.filename}`);
    });
  }
  
  process.exit(0);
}

analyzeVideoData().catch(console.error);