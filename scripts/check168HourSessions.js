const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check168HourSessions() {
  console.log('Checking 168-hour sessions (is168HourSession = true)...\n');
  
  try {
    // Query for documents where is168HourSession = true
    const snapshot = await db.collection('sessions')
      .where('is168HourSession', '==', true)
      .get();
    
    console.log(`Found ${snapshot.size} documents with is168HourSession = true\n`);
    
    if (snapshot.empty) {
      console.log('No 168-hour sessions found.');
      return;
    }
    
    // Track coach name issues
    let issueCount = 0;
    const problematicCoaches = new Set();
    
    console.log('168-Hour Session Details:');
    console.log('=' .repeat(100));
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = data.title || 'No title';
      const parsedCoach = data.parsedCoach || 'No coach';
      const parsedStudent = data.parsedStudent || 'No student';
      const filename = data.filename || 'No filename';
      
      // Check if coach name is problematic (single letter or very short)
      const hasIssue = parsedCoach === 'B' || parsedCoach === 'A' || 
                      parsedCoach.length <= 2 || parsedCoach === 'No coach';
      
      if (hasIssue) {
        issueCount++;
        problematicCoaches.add(parsedCoach);
      }
      
      console.log(`Document ID: ${doc.id}`);
      console.log(`Title: ${title}`);
      console.log(`Parsed Coach: ${parsedCoach} ${hasIssue ? '⚠️  ISSUE' : '✓'}`);
      console.log(`Parsed Student: ${parsedStudent}`);
      console.log(`Filename: ${filename}`);
      console.log('-'.repeat(100));
    });
    
    // Summary
    console.log('\nSUMMARY:');
    console.log('=' .repeat(50));
    console.log(`Total 168-hour sessions: ${snapshot.size}`);
    console.log(`Sessions with coach name issues: ${issueCount} (${(issueCount/snapshot.size*100).toFixed(1)}%)`);
    console.log(`Problematic coach names found: ${Array.from(problematicCoaches).join(', ')}`);
    
    // Group by coach name to see distribution
    console.log('\nCoach Name Distribution:');
    console.log('-'.repeat(50));
    const coachCounts = {};
    snapshot.forEach(doc => {
      const coach = doc.data().parsedCoach || 'No coach';
      coachCounts[coach] = (coachCounts[coach] || 0) + 1;
    });
    
    Object.entries(coachCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([coach, count]) => {
        const percentage = (count / snapshot.size * 100).toFixed(1);
        const isProblematic = coach === 'B' || coach === 'A' || coach.length <= 2 || coach === 'No coach';
        console.log(`${coach}: ${count} sessions (${percentage}%) ${isProblematic ? '⚠️' : ''}`);
      });
    
  } catch (error) {
    console.error('Error checking 168-hour sessions:', error);
  } finally {
    // Close the connection
    await admin.app().delete();
  }
}

// Run the check
check168HourSessions();