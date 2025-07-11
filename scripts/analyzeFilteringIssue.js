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

async function analyzeFilteringIssue() {
  console.log('🔍 Analyzing filtering issues...\n');
  
  const snapshot = await db.collection('indexed_videos')
    .orderBy('uploadDate', 'desc')
    .limit(200)
    .get();
  
  const stats = {
    total: 0,
    byCategory: {},
    byFolderPath: {},
    quickCheckIns: [],
    miscellaneous: [],
    unknownCoaches: [],
    samplePaths: new Set()
  };
  
  snapshot.forEach(doc => {
    const data = doc.data();
    stats.total++;
    
    // Count by category
    const category = data.category || 'no_category';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    
    // Track folder paths
    if (data.folderPath) {
      // Get the top-level folder
      const pathParts = data.folderPath.split('/');
      const topFolder = pathParts[0] || 'root';
      stats.byFolderPath[topFolder] = (stats.byFolderPath[topFolder] || 0) + 1;
      
      // Add sample paths
      if (stats.samplePaths.size < 20) {
        stats.samplePaths.add(data.folderPath);
      }
    }
    
    // Track Quick Check-ins
    if (category === 'Quick Check-in') {
      stats.quickCheckIns.push({
        title: data.title || data.originalTitle,
        coach: data.parsedCoach || data.coach,
        folderPath: data.folderPath,
        filename: data.filename
      });
    }
    
    // Track Miscellaneous
    if (category === 'Miscellaneous') {
      stats.miscellaneous.push({
        title: data.title || data.originalTitle,
        coach: data.parsedCoach || data.coach,
        folderPath: data.folderPath,
        filename: data.filename
      });
    }
    
    // Track Unknown Coaches
    const coachName = data.parsedCoach || data.coach;
    if (!coachName || coachName === 'Unknown' || coachName === 'Unknown Coach') {
      stats.unknownCoaches.push({
        title: data.title || data.originalTitle,
        filename: data.filename,
        folderPath: data.folderPath,
        category: data.category
      });
    }
  });
  
  // Print results
  console.log('📊 STATISTICS:');
  console.log(`Total videos analyzed: ${stats.total}\n`);
  
  console.log('📁 CATEGORIES:');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
  
  console.log('\n📂 TOP-LEVEL FOLDERS:');
  Object.entries(stats.byFolderPath)
    .sort((a, b) => b[1] - a[1])
    .forEach(([folder, count]) => {
      console.log(`  ${folder}: ${count}`);
    });
  
  console.log('\n📍 SAMPLE FOLDER PATHS:');
  Array.from(stats.samplePaths).forEach(path => {
    console.log(`  ${path}`);
  });
  
  console.log(`\n❌ QUICK CHECK-INS (${stats.quickCheckIns.length} found):`);
  stats.quickCheckIns.slice(0, 5).forEach(item => {
    console.log(`  Title: ${item.title}`);
    console.log(`  Coach: ${item.coach}`);
    console.log(`  Path: ${item.folderPath}`);
    console.log(`  File: ${item.filename}\n`);
  });
  
  console.log(`\n❌ MISCELLANEOUS (${stats.miscellaneous.length} found):`);
  stats.miscellaneous.slice(0, 5).forEach(item => {
    console.log(`  Title: ${item.title}`);
    console.log(`  Coach: ${item.coach}`);
    console.log(`  Path: ${item.folderPath}`);
    console.log(`  File: ${item.filename}\n`);
  });
  
  console.log(`\n❓ UNKNOWN COACHES (${stats.unknownCoaches.length} found):`);
  stats.unknownCoaches.slice(0, 10).forEach(item => {
    console.log(`  Title: ${item.title}`);
    console.log(`  Category: ${item.category}`);
    console.log(`  File: ${item.filename}`);
    console.log(`  Path: ${item.folderPath}\n`);
  });
  
  process.exit(0);
}

analyzeFilteringIssue().catch(console.error);