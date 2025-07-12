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

async function fix168HourDuplicates() {
  console.log('🔧 Fixing duplicate 168-hour session entries...\n');
  
  try {
    // Find all 168-hour sessions
    const snapshot = await db.collection('indexed_videos')
      .where('is168HourSession', '==', true)
      .get();
    
    console.log(`Total 168-hour sessions found: ${snapshot.size}\n`);
    
    // Group by student and coach combination
    const sessionGroups = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const student = data.parsedStudent || data.student || 'Unknown';
      const coach = data.parsedCoach || data.coach || 'Unknown';
      const key = `${coach}_${student}`;
      
      const sessionInfo = {
        id: doc.id,
        student: student,
        coach: coach,
        title: data.title,
        driveId: data.driveId,
        date: data.date,
        createdAt: data.createdAt,
        filename: data.filename,
        fullData: data
      };
      
      if (!sessionGroups[key]) {
        sessionGroups[key] = [];
      }
      sessionGroups[key].push(sessionInfo);
    });
    
    // Find duplicates
    const duplicateGroups = {};
    let totalDuplicates = 0;
    const toRemove = [];
    const backupData = [];
    
    Object.entries(sessionGroups).forEach(([key, sessions]) => {
      if (sessions.length > 1) {
        duplicateGroups[key] = sessions;
        totalDuplicates += sessions.length - 1;
        
        // Sort by creation date or filename to be consistent
        sessions.sort((a, b) => {
          // First try creation date
          const dateA = a.createdAt?._seconds || 0;
          const dateB = b.createdAt?._seconds || 0;
          if (dateA !== dateB) return dateA - dateB;
          
          // Then by filename
          return (a.filename || '').localeCompare(b.filename || '');
        });
        
        // Keep first, remove rest
        for (let i = 1; i < sessions.length; i++) {
          toRemove.push(sessions[i]);
          backupData.push({
            key: key,
            documentId: sessions[i].id,
            data: sessions[i].fullData
          });
        }
      }
    });
    
    if (toRemove.length === 0) {
      console.log('✅ No duplicate 168-hour sessions found!');
      return;
    }
    
    console.log(`⚠️  Found ${Object.keys(duplicateGroups).length} groups with duplicates`);
    console.log(`Total duplicate entries to remove: ${toRemove.length}\n`);
    
    // Display what will be removed
    console.log('📋 Sessions to be removed:');
    Object.entries(duplicateGroups).forEach(([key, sessions]) => {
      const [coach, student] = key.split('_');
      console.log(`\n${coach} & ${student}:`);
      console.log(`  ✅ Keep: ${sessions[0].title} (${sessions[0].driveId})`);
      for (let i = 1; i < sessions.length; i++) {
        console.log(`  🗑️  Remove: ${sessions[i].title} (${sessions[i].driveId})`);
      }
    });
    
    // Create backup
    const backupPath = path.join(__dirname, `168hour-duplicates-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`\n💾 Backup saved to: ${backupPath}`);
    
    // Remove duplicates
    console.log('\n🗑️  Removing duplicates...');
    let removed = 0;
    for (const session of toRemove) {
      try {
        await db.collection('indexed_videos').doc(session.id).delete();
        removed++;
        console.log(`✅ Removed ${removed}/${toRemove.length}: ${session.id} (${session.coach} & ${session.student})`);
      } catch (error) {
        console.error(`❌ Failed to remove ${session.id}:`, error.message);
      }
    }
    
    console.log(`\n✅ Duplicate removal complete! Removed ${removed} documents.`);
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const verifySnapshot = await db.collection('indexed_videos')
      .where('is168HourSession', '==', true)
      .get();
    
    const finalGroups = {};
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      const student = data.parsedStudent || data.student || 'Unknown';
      const coach = data.parsedCoach || data.coach || 'Unknown';
      const key = `${coach} & ${student}`;
      finalGroups[key] = (finalGroups[key] || 0) + 1;
    });
    
    console.log(`\nTotal 168-hour sessions remaining: ${verifySnapshot.size}`);
    console.log('\n📊 Final count per coach-student pair:');
    Object.entries(finalGroups).forEach(([pair, count]) => {
      console.log(`${pair}: ${count} session(s)`);
    });
    
    // Check if any duplicates remain
    const remainingDuplicates = Object.entries(finalGroups).filter(([_, count]) => count > 1);
    if (remainingDuplicates.length > 0) {
      console.log('\n⚠️  WARNING: Some duplicates may still remain:');
      remainingDuplicates.forEach(([pair, count]) => {
        console.log(`${pair}: ${count} sessions`);
      });
    } else {
      console.log('\n✅ All duplicates successfully removed!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await admin.app().delete();
  }
}

// Run the script
fix168HourDuplicates().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});