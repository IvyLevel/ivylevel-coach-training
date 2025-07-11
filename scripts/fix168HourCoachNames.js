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

// Known coaches and data sources from flexibleDataParser.js
const KNOWN_COACHES = ['Jenny', 'Rishi', 'Noor', 'Juli', 'Aditi', 'Marissa', 'Jamie', 'Erin', 'Steven', 'Kelvin'];
const DATA_SOURCES = ['A', 'B', 'C'];

// Function to extract the actual coach name from title
function extractCoachFromTitle(title) {
  if (!title) return null;
  
  // Remove data source indicators (A, B, C) from title
  let cleanTitle = title;
  DATA_SOURCES.forEach(source => {
    // Remove patterns like "B & " or " & B"
    cleanTitle = cleanTitle.replace(new RegExp(`\\b${source}\\s*&`, 'g'), '');
    cleanTitle = cleanTitle.replace(new RegExp(`&\\s*${source}\\b`, 'g'), '');
  });
  
  // Pattern: "CoachName & StudentName"
  const nameMatch = cleanTitle.match(/^(\w+)\s*&\s*(\w+)/);
  if (nameMatch) {
    const [_, first, second] = nameMatch;
    
    // Check if first name is a known coach
    if (KNOWN_COACHES.includes(first)) {
      return first;
    }
    // Check if second name is a known coach
    if (KNOWN_COACHES.includes(second)) {
      return second;
    }
    
    // If we can't determine, return the first name as it's usually the coach
    return first;
  }
  
  return null;
}

async function fix168HourCoachNames() {
  console.log('🔧 Fixing coach names for 168-hour sessions...\n');
  
  try {
    // Query all documents tagged as 168-hour sessions
    const snapshot = await db.collection('indexed_videos')
      .where('is168HourSession', '==', true)
      .get();
    
    console.log(`Found ${snapshot.size} 168-hour sessions to check\n`);
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    const batch = db.batch();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const currentCoach = data.parsedCoach || data.coach;
      
      // Check if current coach is a data source letter
      if (DATA_SOURCES.includes(currentCoach)) {
        // Extract the actual coach from the title
        const actualCoach = extractCoachFromTitle(data.title || data.originalTitle);
        
        if (actualCoach && actualCoach !== currentCoach) {
          console.log(`📝 Fixing: ${data.title}`);
          console.log(`   Current coach: "${currentCoach}" → Actual coach: "${actualCoach}"`);
          
          // Update the document
          const updates = {
            parsedCoach: actualCoach,
            coach: actualCoach,
            dataSource: currentCoach, // Save the data source indicator
            coachNameFixed: true,
            coachNameFixedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          // Update title if it still contains the data source letter
          if (data.title && data.title.includes(`${currentCoach} &`)) {
            updates.title = data.title.replace(`${currentCoach} &`, `${actualCoach} &`);
            updates.originalTitleBeforeFix = data.title;
          }
          
          // Update filename if needed
          if (data.filename && data.filename.includes(`_${currentCoach}_`)) {
            updates.filename = data.filename.replace(`_${currentCoach}_`, `_${actualCoach}_`);
            updates.originalFilenameBeforeFix = data.filename;
          }
          
          batch.update(doc.ref, updates);
          fixedCount++;
        }
      } else {
        alreadyCorrectCount++;
      }
    });
    
    // Commit the batch
    if (fixedCount > 0) {
      console.log(`\n💾 Committing fixes for ${fixedCount} documents...`);
      await batch.commit();
      console.log('✅ Fixes committed successfully!');
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Fixed: ${fixedCount} documents`);
    console.log(`✅ Already correct: ${alreadyCorrectCount} documents`);
    console.log(`📋 Total processed: ${snapshot.size} documents`);
    
    // Verify the fixes
    if (fixedCount > 0) {
      console.log('\n🔍 Verifying fixes...');
      const verifySnapshot = await db.collection('indexed_videos')
        .where('coachNameFixed', '==', true)
        .limit(5)
        .get();
      
      console.log('\nSample of fixed documents:');
      verifySnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\n✅ ${data.title}`);
        console.log(`   Coach: ${data.parsedCoach}`);
        console.log(`   Data Source: ${data.dataSource}`);
      });
    }
    
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

console.log('⚠️  This script will fix coach names for 168-hour sessions where data source letters (A/B/C) were incorrectly parsed as coach names.\n');

rl.question('Do you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    rl.close();
    fix168HourCoachNames()
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