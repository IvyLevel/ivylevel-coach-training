const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function analyzeCoaches() {
  console.log('🔍 Analyzing coach names in indexed_videos...\n');
  
  const snapshot = await db.collection('indexed_videos').get();
  const coachCounts = {};
  const samplesByCoach = {};
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const coach = data.parsedCoach || data.coach || 'Unknown';
    
    if (!coachCounts[coach]) {
      coachCounts[coach] = 0;
      samplesByCoach[coach] = [];
    }
    
    coachCounts[coach]++;
    if (samplesByCoach[coach].length < 3) {
      samplesByCoach[coach].push({
        title: data.title || data.originalTitle,
        student: data.parsedStudent || data.student,
        category: data.category
      });
    }
  });
  
  // Sort by count
  const sortedCoaches = Object.entries(coachCounts)
    .sort((a, b) => b[1] - a[1]);
  
  console.log('📊 Coach Distribution:\n');
  sortedCoaches.forEach(([coach, count]) => {
    console.log(`${coach}: ${count} videos`);
    console.log('  Sample videos:');
    samplesByCoach[coach].forEach(sample => {
      console.log(`    - "${sample.title}" (Student: ${sample.student})`);
    });
    console.log('');
  });
  
  console.log(`\n📈 Total unique coaches: ${sortedCoaches.length}`);
  console.log(`📹 Total videos: ${snapshot.size}`);
  
  // Check for Kelvin specifically
  console.log('\n🔍 Searching for Kelvin Nguyen videos...');
  const kelvinVideos = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if ((data.parsedCoach && data.parsedCoach.toLowerCase().includes('kelvin')) ||
        (data.coach && data.coach.toLowerCase().includes('kelvin')) ||
        (data.title && data.title.toLowerCase().includes('kelvin')) ||
        (data.originalTitle && data.originalTitle.toLowerCase().includes('kelvin'))) {
      kelvinVideos.push({
        id: doc.id,
        title: data.title || data.originalTitle,
        parsedCoach: data.parsedCoach,
        coach: data.coach,
        student: data.parsedStudent || data.student
      });
    }
  });
  
  console.log(`Found ${kelvinVideos.length} videos related to Kelvin:`);
  kelvinVideos.forEach(video => {
    console.log(`  - ${video.title} (Coach field: ${video.parsedCoach || video.coach})`);
  });
  
  process.exit(0);
}

analyzeCoaches().catch(console.error);