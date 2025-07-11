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

async function checkRemainingIssues() {
  console.log('🔍 Checking for remaining title issues...\n');
  
  const snapshot = await db.collection('indexed_videos')
    .orderBy('uploadDate', 'desc')
    .get();
  
  const issues = {
    dataSourceInTitle: [],
    unknownCoach: [],
    unknownStudent: [],
    gamePlanWithDataSource: []
  };
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const title = data.title || '';
    const coach = data.parsedCoach || data.coach || '';
    const student = data.parsedStudent || data.student || '';
    
    // Check for data source in title
    if (title.includes('B & ') || title.includes('A & ') || title.includes('C & ')) {
      if (coach === 'Unknown' || student === 'Unknown' || !coach || !student) {
        issues.dataSourceInTitle.push({
          title,
          coach,
          student,
          category: data.category
        });
      }
    }
    
    // Check for game plans with data source
    if ((title.toLowerCase().includes('gameplan') || data.category === 'game_plan_reports') && 
        (title.includes('& B') || title.includes('& A') || title.includes('& C'))) {
      issues.gamePlanWithDataSource.push({
        title,
        coach,
        student,
        category: data.category
      });
    }
  });
  
  console.log('📊 ANALYSIS RESULTS:\n');
  
  console.log(`Sessions still showing data source in title: ${issues.dataSourceInTitle.length}`);
  if (issues.dataSourceInTitle.length > 0) {
    console.log('\nSample of remaining issues:');
    issues.dataSourceInTitle.slice(0, 5).forEach(issue => {
      console.log(`  - "${issue.title}"`);
      console.log(`    Coach: ${issue.coach || 'Not set'}, Student: ${issue.student || 'Not set'}`);
    });
  }
  
  console.log(`\nGame plans with data source format: ${issues.gamePlanWithDataSource.length}`);
  if (issues.gamePlanWithDataSource.length > 0) {
    console.log('\nSample game plans:');
    issues.gamePlanWithDataSource.slice(0, 5).forEach(issue => {
      console.log(`  - "${issue.title}"`);
      console.log(`    Coach: ${issue.coach || 'Not set'}, Student: ${issue.student || 'Not set'}`);
    });
  }
  
  // Count by category
  const categoryCount = {};
  [...issues.dataSourceInTitle, ...issues.gamePlanWithDataSource].forEach(issue => {
    categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
  });
  
  console.log('\n📈 Issues by category:');
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
  
  process.exit(0);
}

checkRemainingIssues().catch(console.error);