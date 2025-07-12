const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ivylevel-coach-training.firebaseio.com"
});

const db = admin.firestore();

async function fixAllDuplicateGamePlans() {
  console.log('🔧 Fixing ALL duplicate Game Plan entries...\n');
  
  try {
    // Get all game plan entries
    const allGamePlans = await db.collection('indexed_videos')
      .where('category', '==', 'game_plan_reports')
      .get();
    
    // Group by student
    const studentGamePlans = {};
    allGamePlans.forEach(doc => {
      const data = doc.data();
      const student = data.parsedStudent || data.student || 'Unknown';
      if (!studentGamePlans[student]) {
        studentGamePlans[student] = [];
      }
      studentGamePlans[student].push({
        id: doc.id,
        title: data.title,
        driveId: data.driveId,
        createdAt: data.createdAt,
        date: data.date,
        filename: data.filename,
        fullData: data
      });
    });
    
    console.log('📊 Game Plan Summary:');
    const studentsWithDuplicates = [];
    Object.entries(studentGamePlans).forEach(([student, plans]) => {
      console.log(`${student}: ${plans.length} game plan(s)`);
      if (plans.length > 1) {
        studentsWithDuplicates.push(student);
      }
    });
    
    if (studentsWithDuplicates.length === 0) {
      console.log('\n✅ No duplicate game plans found!');
      return;
    }
    
    console.log(`\n⚠️  Found ${studentsWithDuplicates.length} students with duplicate game plans:`);
    console.log(studentsWithDuplicates.join(', '));
    
    const allBackupData = [];
    const toRemove = [];
    
    // Process each student with duplicates
    for (const student of studentsWithDuplicates) {
      const plans = studentGamePlans[student];
      console.log(`\n\n📌 Processing ${student}'s ${plans.length} game plans:`);
      
      // Group by title to find true duplicates
      const titleGroups = {};
      plans.forEach(plan => {
        const title = plan.title || 'Untitled';
        if (!titleGroups[title]) {
          titleGroups[title] = [];
        }
        titleGroups[title].push(plan);
      });
      
      // For each title group with duplicates
      Object.entries(titleGroups).forEach(([title, sameTitlePlans]) => {
        if (sameTitlePlans.length > 1) {
          console.log(`\n  "${title}" has ${sameTitlePlans.length} entries:`);
          
          // Sort by creation date or keep first one
          sameTitlePlans.sort((a, b) => {
            const dateA = a.createdAt?._seconds || 0;
            const dateB = b.createdAt?._seconds || 0;
            return dateA - dateB;
          });
          
          // Keep the first one, remove the rest
          const keep = sameTitlePlans[0];
          const remove = sameTitlePlans.slice(1);
          
          console.log(`    ✅ Keep: ${keep.driveId} (ID: ${keep.id})`);
          remove.forEach(plan => {
            console.log(`    🗑️  Remove: ${plan.driveId} (ID: ${plan.id})`);
            toRemove.push(plan);
            allBackupData.push({
              student: student,
              documentId: plan.id,
              data: plan.fullData
            });
          });
        }
      });
    }
    
    if (toRemove.length === 0) {
      console.log('\n✅ No duplicates to remove after detailed analysis.');
      return;
    }
    
    console.log(`\n\n📊 Total duplicates to remove: ${toRemove.length}`);
    
    // Create backup
    const backupPath = path.join(__dirname, `all-gameplan-duplicates-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(allBackupData, null, 2));
    console.log(`💾 Backup saved to: ${backupPath}`);
    
    // Remove duplicates
    console.log('\n🗑️  Removing duplicates...');
    let removed = 0;
    for (const plan of toRemove) {
      try {
        await db.collection('indexed_videos').doc(plan.id).delete();
        removed++;
        console.log(`✅ Removed ${removed}/${toRemove.length}: ${plan.id}`);
      } catch (error) {
        console.error(`❌ Failed to remove ${plan.id}:`, error.message);
      }
    }
    
    console.log(`\n✅ Duplicate removal complete! Removed ${removed} documents.`);
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const verifyQuery = await db.collection('indexed_videos')
      .where('category', '==', 'game_plan_reports')
      .get();
    
    const finalCount = {};
    verifyQuery.forEach(doc => {
      const data = doc.data();
      const student = data.parsedStudent || data.student || 'Unknown';
      finalCount[student] = (finalCount[student] || 0) + 1;
    });
    
    console.log('\n📊 Final game plan count per student:');
    Object.entries(finalCount).forEach(([student, count]) => {
      console.log(`${student}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await admin.app().delete();
  }
}

// Run the script
fixAllDuplicateGamePlans().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});