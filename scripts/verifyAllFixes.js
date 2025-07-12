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

async function verifyAllFixes() {
  console.log('🔍 Verifying all Game Plan fixes...\n');
  
  // Check Ananyaa's game plan specifically
  const ananyaaQuery = await db.collection('indexed_videos')
    .where('category', '==', 'game_plan_reports')
    .where('parsedStudent', '==', 'Ananyaa')
    .get();
  
  console.log('📌 ANANYAA\'s Game Plan Sessions:');
  ananyaaQuery.forEach(doc => {
    const data = doc.data();
    console.log(`  Coach: ${data.parsedCoach}`);
    console.log(`  Duration: ${data.duration} (should be 90:00)`);
    console.log(`  Title: ${data.title}`);
    console.log('---');
  });
  
  // Check all game plans
  const allGamePlans = await db.collection('indexed_videos')
    .where('category', '==', 'game_plan_reports')
    .get();
  
  const stats = {
    total: 0,
    jennyCount: 0,
    correctDuration: 0,
    wrongDuration: []
  };
  
  allGamePlans.forEach(doc => {
    const data = doc.data();
    stats.total++;
    
    if (data.parsedCoach === 'Jenny') {
      stats.jennyCount++;
    }
    
    if (data.duration === '90:00' || data.duration === '89:00' || parseInt(data.duration) > 60) {
      stats.correctDuration++;
    } else {
      stats.wrongDuration.push({
        student: data.parsedStudent,
        duration: data.duration,
        coach: data.parsedCoach
      });
    }
  });
  
  console.log('\n📊 OVERALL GAME PLAN STATISTICS:');
  console.log(`Total Game Plans: ${stats.total}`);
  console.log(`Game Plans with Jenny as coach: ${stats.jennyCount} (${Math.round(stats.jennyCount/stats.total*100)}%)`);
  console.log(`Game Plans with correct duration: ${stats.correctDuration} (${Math.round(stats.correctDuration/stats.total*100)}%)`);
  
  if (stats.wrongDuration.length > 0) {
    console.log('\n⚠️  Sessions still with wrong duration:');
    stats.wrongDuration.forEach(s => {
      console.log(`  - ${s.student}: ${s.duration}`);
    });
  }
  
  process.exit(0);
}

verifyAllFixes().catch(console.error);