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

// Duration mapping for common incorrect values
const DURATION_FIXES = {
  '5:00': '90:00',  // Most game plans are ~90 minutes
  '0:05': '90:00',  // Another common wrong value
};

async function fixGamePlanIssues() {
  console.log('🔧 Fixing Game Plan data issues...\n');
  
  const snapshot = await db.collection('indexed_videos')
    .where('category', '==', 'game_plan_reports')
    .get();
  
  console.log(`Found ${snapshot.size} Game Plan sessions to check\n`);
  
  let fixCount = 0;
  const batch = db.batch();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const filename = data.filename || '';
    let needsUpdate = false;
    const updates = {};
    
    // Fix 1: Ensure coach is Jenny for game plans
    if (filename.includes('GamePlan_')) {
      const parts = filename.split('_');
      if (parts.length >= 5) {
        // Format: Coaching_GamePlan_B_Jenny_Ananyaa_...
        const correctCoach = parts[3];
        const correctStudent = parts[4];
        
        if (correctCoach === 'Jenny' && data.parsedCoach !== 'Jenny') {
          console.log(`📝 Fixing coach for ${correctStudent}: ${data.parsedCoach} → Jenny`);
          updates.parsedCoach = 'Jenny';
          updates.coach = 'Jenny';
          needsUpdate = true;
        }
        
        // Also fix the title
        if (data.title && !data.title.includes('Jenny') && correctCoach === 'Jenny') {
          updates.title = `Jenny & ${correctStudent} - Game Plan`;
          const weekMatch = data.title.match(/Week\s+(\d+)/i);
          if (weekMatch) {
            updates.title += ` - Week ${weekMatch[1]}`;
          }
          const dateMatch = data.title.match(/\(([^)]+)\)/);
          if (dateMatch) {
            updates.title += ` (${dateMatch[1]})`;
          }
          needsUpdate = true;
        }
      }
    }
    
    // Fix 2: Update duration if it's a known wrong value
    if (DURATION_FIXES[data.duration]) {
      console.log(`📝 Fixing duration for ${data.parsedStudent}: ${data.duration} → ${DURATION_FIXES[data.duration]}`);
      updates.duration = DURATION_FIXES[data.duration];
      updates.durationFixed = true;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      batch.update(doc.ref, updates);
      fixCount++;
    }
  });
  
  if (fixCount > 0) {
    console.log(`\n💾 Committing ${fixCount} fixes...`);
    await batch.commit();
    console.log('✅ Fixes committed successfully!');
  } else {
    console.log('✅ No fixes needed - all game plans look correct');
  }
  
  process.exit(0);
}

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  This script will fix Game Plan issues:');
console.log('  1. Ensure all game plans show Jenny as coach');
console.log('  2. Fix incorrect durations (5:00 → 90:00)\n');

rl.question('Do you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    rl.close();
    fixGamePlanIssues().catch(console.error);
  } else {
    console.log('❌ Operation cancelled.');
    rl.close();
    process.exit(0);
  }
});