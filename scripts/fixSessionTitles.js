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

async function fixSessionTitles() {
  console.log('🔧 Fixing session titles with data source letters...\n');
  
  try {
    const snapshot = await db.collection('indexed_videos').get();
    
    let fixCount = 0;
    const updates = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = data.title || '';
      
      // Check if title contains data source pattern
      if (title.includes('B & ') || title.includes('A & ') || title.includes('C & ')) {
        const coach = data.parsedCoach || data.coach || '';
        const student = data.parsedStudent || data.student || '';
        
        if (coach && student && coach !== 'Unknown' && student !== 'Unknown') {
          // Extract week number if present
          const weekMatch = title.match(/Week\s+(\d+)/i);
          const dateMatch = title.match(/\(([^)]+)\)/);
          
          // Build new title
          let newTitle = `${coach} & ${student}`;
          if (weekMatch) {
            newTitle += ` - Week ${weekMatch[1]}`;
          }
          if (dateMatch) {
            newTitle += ` (${dateMatch[1]})`;
          }
          
          // Special case for 168-hour sessions
          if (data.is168HourSession) {
            newTitle = `${coach} & ${student} - 168 Hour Scheduling`;
          }
          
          // Special case for game plans
          if (data.category === 'game_plan_reports' || title.toLowerCase().includes('gameplan')) {
            newTitle = `${coach} & ${student} - Game Plan`;
            if (weekMatch) {
              newTitle += ` - Week ${weekMatch[1]}`;
            }
          }
          
          // Update if different
          if (newTitle !== title) {
            updates.push({
              ref: doc.ref,
              oldTitle: title,
              newTitle: newTitle
            });
          }
        }
      }
    });
    
    // Process updates in batches
    console.log(`Found ${updates.length} titles to fix\n`);
    
    for (let i = 0; i < updates.length; i += 500) {
      const batch = db.batch();
      const batchUpdates = updates.slice(i, i + 500);
      
      batchUpdates.forEach(update => {
        console.log(`📝 Fixing: "${update.oldTitle}"`);
        console.log(`   → New: "${update.newTitle}"`);
        
        batch.update(update.ref, {
          title: update.newTitle,
          originalTitleBeforeFix: update.oldTitle,
          titleFixed: true,
          titleFixedAt: admin.firestore.FieldValue.serverTimestamp()
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

console.log('⚠️  This script will fix session titles that show data source letters (A/B/C) instead of proper coach & student names.\n');
console.log('Examples of fixes:');
console.log('  "B & Rishi - Week 21" → "Rishi & Aarav - Week 21"');
console.log('  "A & Jenny - Week 5" → "Jenny & Sofia - Week 5"\n');

rl.question('Do you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    rl.close();
    fixSessionTitles()
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