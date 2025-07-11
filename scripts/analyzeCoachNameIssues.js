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

const DATA_SOURCES = ['A', 'B', 'C'];
const KNOWN_COACHES = ['Jenny', 'Rishi', 'Noor', 'Juli', 'Aditi', 'Marissa', 'Jamie', 'Erin', 'Steven', 'Kelvin'];

async function analyzeCoachNameIssues() {
  console.log('🔍 Analyzing coach name issues in the database...\n');
  
  try {
    // Get all documents
    const snapshot = await db.collection('indexed_videos').get();
    console.log(`Total documents: ${snapshot.size}\n`);
    
    const stats = {
      total: snapshot.size,
      dataSourceAsCoach: 0,
      dataSourceAsStudent: 0,
      correct: 0,
      unknown: 0,
      missing: 0,
      samples: {
        dataSourceAsCoach: [],
        dataSourceAsStudent: []
      }
    };
    
    // Analyze each document
    snapshot.forEach(doc => {
      const data = doc.data();
      const coach = data.parsedCoach || data.coach;
      const student = data.parsedStudent || data.student;
      
      // Check if coach is a data source letter
      if (DATA_SOURCES.includes(coach)) {
        stats.dataSourceAsCoach++;
        if (stats.samples.dataSourceAsCoach.length < 5) {
          stats.samples.dataSourceAsCoach.push({
            id: doc.id,
            title: data.title || data.originalTitle,
            coach: coach,
            student: student,
            category: data.category,
            is168Hour: data.is168HourSession || false
          });
        }
      }
      
      // Check if student is a data source letter
      if (DATA_SOURCES.includes(student)) {
        stats.dataSourceAsStudent++;
        if (stats.samples.dataSourceAsStudent.length < 5) {
          stats.samples.dataSourceAsStudent.push({
            id: doc.id,
            title: data.title || data.originalTitle,
            coach: coach,
            student: student,
            category: data.category
          });
        }
      }
      
      // Check other conditions
      if (!coach) {
        stats.missing++;
      } else if (KNOWN_COACHES.includes(coach)) {
        stats.correct++;
      } else if (!DATA_SOURCES.includes(coach)) {
        stats.unknown++;
      }
    });
    
    // Display results
    console.log('📊 ANALYSIS RESULTS:\n');
    console.log(`✅ Correct coach names: ${stats.correct} (${(stats.correct/stats.total*100).toFixed(1)}%)`);
    console.log(`❌ Data source as coach (A/B/C): ${stats.dataSourceAsCoach} (${(stats.dataSourceAsCoach/stats.total*100).toFixed(1)}%)`);
    console.log(`❌ Data source as student: ${stats.dataSourceAsStudent} (${(stats.dataSourceAsStudent/stats.total*100).toFixed(1)}%)`);
    console.log(`❓ Unknown coach names: ${stats.unknown} (${(stats.unknown/stats.total*100).toFixed(1)}%)`);
    console.log(`⚠️  Missing coach names: ${stats.missing} (${(stats.missing/stats.total*100).toFixed(1)}%)`);
    
    // Show samples of problematic documents
    if (stats.dataSourceAsCoach > 0) {
      console.log('\n\n❌ SAMPLE DOCUMENTS WITH DATA SOURCE AS COACH:');
      stats.samples.dataSourceAsCoach.forEach(sample => {
        console.log(`\n📄 ${sample.title}`);
        console.log(`   ID: ${sample.id}`);
        console.log(`   Coach: "${sample.coach}" (should be extracted from title)`);
        console.log(`   Student: ${sample.student}`);
        console.log(`   Category: ${sample.category}`);
        console.log(`   Is 168-hour: ${sample.is168Hour ? 'Yes ⚠️' : 'No'}`);
      });
    }
    
    // Check specifically for 168-hour sessions
    const snapshot168 = await db.collection('indexed_videos')
      .where('is168HourSession', '==', true)
      .get();
    
    let problematic168Count = 0;
    snapshot168.forEach(doc => {
      const coach = doc.data().parsedCoach || doc.data().coach;
      if (DATA_SOURCES.includes(coach)) {
        problematic168Count++;
      }
    });
    
    console.log('\n\n🎯 168-HOUR SESSION ANALYSIS:');
    console.log(`Total 168-hour sessions: ${snapshot168.size}`);
    console.log(`With data source as coach: ${problematic168Count} (${(problematic168Count/snapshot168.size*100).toFixed(1)}%)`);
    
    // Suggest next steps
    console.log('\n\n💡 RECOMMENDED ACTIONS:');
    if (stats.dataSourceAsCoach > 0) {
      console.log('\n1. Fix data source letters incorrectly used as coach names:');
      console.log('   node scripts/flexibleDataParser.js');
      console.log('   OR');
      console.log('   node scripts/fix168HourCoachNames.js (for 168-hour sessions only)');
    }
    
    if (stats.unknown > 0) {
      console.log('\n2. Review unknown coach names - they might need to be added to KNOWN_COACHES list');
    }
    
    if (stats.missing > 0) {
      console.log('\n3. Some documents have missing coach names - may need manual review');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeCoachNameIssues()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });