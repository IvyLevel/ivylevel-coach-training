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

async function fixAllTitleIssues() {
  console.log('🔧 Fixing ALL remaining title issues...\n');
  
  try {
    const snapshot = await db.collection('indexed_videos').get();
    
    const updates = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = data.title || '';
      let newTitle = title;
      let needsUpdate = false;
      
      // Handle Game Plan titles
      if (title.toLowerCase().includes('gameplan') && 
          (title.includes('& A') || title.includes('& B') || title.includes('& C'))) {
        const coach = data.parsedCoach || data.coach || 'Unknown';
        const student = data.parsedStudent || data.student || 'Unknown';
        
        // Extract week if present
        const weekMatch = title.match(/Week\s+(\d+)/i);
        const dateMatch = title.match(/\(([^)]+)\)/);
        
        newTitle = `${coach} & ${student} - Game Plan`;
        if (weekMatch) {
          newTitle += ` - Week ${weekMatch[1]}`;
        }
        if (dateMatch) {
          newTitle += ` (${dateMatch[1]})`;
        }
        needsUpdate = true;
      }
      
      // Handle sessions with "B & Unknown Student" pattern
      else if (title.includes('Unknown Student') || title.includes('Unknown Coach')) {
        const coach = data.parsedCoach || data.coach || 'Unknown';
        const student = data.parsedStudent || data.student || 'Unknown';
        
        // Extract week and date if present
        const weekMatch = title.match(/Week\s+(\d+)/i);
        const dateMatch = title.match(/\(([^)]+)\)/);
        
        // Build clean title
        newTitle = `${coach} & ${student}`;
        if (weekMatch) {
          newTitle += ` - Week ${weekMatch[1]}`;
        }
        if (dateMatch) {
          newTitle += ` (${dateMatch[1]})`;
        }
        
        // Special handling for 168-hour sessions
        if (data.is168HourSession) {
          newTitle = `${coach} & ${student} - 168 Hour Scheduling`;
        }
        
        needsUpdate = true;
      }
      
      // Handle any remaining "A &", "B &", "C &" patterns
      else if (title.match(/\b[ABC]\s*&\s*/)) {
        const coach = data.parsedCoach || data.coach || 'Unknown';
        const student = data.parsedStudent || data.student || 'Unknown';
        
        // Replace the data source pattern
        newTitle = title.replace(/\b[ABC]\s*&\s*/, `${coach} & `);
        
        // If coach is unknown but we have a pattern like "B & SomeName"
        if (coach === 'Unknown' && title.match(/\b[ABC]\s*&\s*(\w+)/)) {
          const nameMatch = title.match(/\b[ABC]\s*&\s*(\w+)/);
          if (nameMatch && nameMatch[1] !== 'Unknown') {
            // The name after & might be the coach
            newTitle = title.replace(/\b[ABC]\s*&\s*/, '');
          }
        }
        
        needsUpdate = title !== newTitle;
      }
      
      if (needsUpdate && newTitle !== title) {
        updates.push({
          ref: doc.ref,
          oldTitle: title,
          newTitle: newTitle,
          category: data.category
        });
      }
    });
    
    // Process updates in batches
    console.log(`Found ${updates.length} titles to fix\n`);
    
    // Group by category for better visibility
    const byCategory = {};
    updates.forEach(u => {
      if (!byCategory[u.category]) byCategory[u.category] = [];
      byCategory[u.category].push(u);
    });
    
    console.log('📊 Updates by category:');
    Object.entries(byCategory).forEach(([cat, items]) => {
      console.log(`  ${cat}: ${items.length} updates`);
    });
    console.log('');
    
    let fixCount = 0;
    
    for (let i = 0; i < updates.length; i += 500) {
      const batch = db.batch();
      const batchUpdates = updates.slice(i, i + 500);
      
      batchUpdates.forEach(update => {
        console.log(`📝 Fixing: "${update.oldTitle}"`);
        console.log(`   → New: "${update.newTitle}"`);
        
        batch.update(update.ref, {
          title: update.newTitle,
          originalTitleBeforeFix2: update.oldTitle,
          titleFixed2: true,
          titleFixedAt2: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      console.log(`\n💾 Committing batch ${Math.floor(i/500) + 1} of ${Math.ceil(updates.length/500)}...`);
      await batch.commit();
      fixCount += batchUpdates.length;
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Fixed ${fixCount} titles`);
    console.log(`📋 Total documents processed: ${snapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  This script will fix ALL remaining title issues including:');
console.log('  - Game plans showing "Gameplan & A/B/C"');
console.log('  - Sessions with "Unknown Student/Coach" in titles');
console.log('  - Any remaining data source letters in titles\n');

rl.question('Do you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    rl.close();
    fixAllTitleIssues()
      .then(() => {
        console.log('\n✅ Process complete!');
        process.exit(0);
      })
      .catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
      });
  } else {
    console.log('❌ Operation cancelled.');
    rl.close();
    process.exit(0);
  }
});