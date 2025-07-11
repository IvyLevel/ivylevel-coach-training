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

async function tag168HourSessions() {
  console.log('🏷️  Starting 168-hour session tagging process...\n');
  
  // Load the analysis results
  const resultsPath = path.join(__dirname, '168hour_sessions.json');
  if (!fs.existsSync(resultsPath)) {
    console.error('❌ No analysis results found. Please run identify168HourSessions.js first.');
    process.exit(1);
  }
  
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const sessionsToTag = results.highConfidence;
  
  console.log(`Found ${sessionsToTag.length} high-confidence 168-hour sessions to tag\n`);
  
  // Process each session
  let successCount = 0;
  let errorCount = 0;
  
  for (const session of sessionsToTag) {
    try {
      const docRef = db.collection('indexed_videos').doc(session.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        console.log(`❌ Document ${session.id} not found`);
        errorCount++;
        continue;
      }
      
      const data = doc.data();
      
      // Generate new filename with 168 tag
      let newFilename = data.filename || '';
      const dataSource = data.dataSource || 'A';
      
      if (newFilename.startsWith('Coaching_')) {
        // Replace Coaching_ with Coaching_168_
        const parts = newFilename.split('_');
        parts.splice(1, 0, '168'); // Insert '168' after 'Coaching'
        newFilename = parts.join('_');
      } else {
        // Create new filename format
        const coach = session.coach || 'Unknown';
        const student = session.student || 'Unknown';
        const week = data.parsedWeek || 'Unknown';
        const date = data.sessionDate || data.uploadDate;
        const dateStr = new Date(date).toISOString().split('T')[0];
        
        newFilename = `Coaching_168_${dataSource}_${coach}_${student}_Wk${week}_${dateStr}_M_${session.id}.mp4`;
      }
      
      // Update the document
      const updateData = {
        filename: newFilename,
        is168HourSession: true,
        sessionType: '168_hour_scheduling',
        tags: [...(data.tags || []), '168-hour', 'scheduling', 'time-management'],
        '168HourIdentification': {
          identifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          confidence: session.confidence,
          score: session.score,
          signals: session.signals
        }
      };
      
      // Update title if needed
      if (!data.title?.includes('168')) {
        updateData.title = `${session.coach} & ${session.student} - 168 Hour Scheduling`;
      }
      
      await docRef.update(updateData);
      
      console.log(`✅ Tagged: ${session.title}`);
      console.log(`   New filename: ${newFilename}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error updating ${session.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n\n📊 TAGGING COMPLETE!');
  console.log(`✅ Successfully tagged: ${successCount} sessions`);
  console.log(`❌ Errors: ${errorCount}`);
  
  // Archive the results file
  const archivePath = path.join(__dirname, `168hour_sessions_${new Date().toISOString().split('T')[0]}.json`);
  fs.renameSync(resultsPath, archivePath);
  console.log(`\n💾 Results archived to: ${archivePath}`);
  
  process.exit(0);
}

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will update documents in the database.');
console.log('This will tag identified sessions with 168-hour scheduling metadata.\n');

rl.question('Do you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    rl.close();
    tag168HourSessions().catch(console.error);
  } else {
    console.log('❌ Operation cancelled.');
    rl.close();
    process.exit(0);
  }
});