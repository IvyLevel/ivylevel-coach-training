const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findActual168Sessions() {
  console.log('Searching for actual 168-hour coaching sessions in heroCoaches subcollections...\n');
  
  try {
    // Get all hero coaches
    const coachesSnapshot = await db.collection('heroCoaches').get();
    console.log(`Found ${coachesSnapshot.size} coaches to check\n`);
    
    let total168Sessions = 0;
    const all168Sessions = [];
    
    // For each coach, check their sessions subcollection
    for (const coachDoc of coachesSnapshot.docs) {
      const coachData = coachDoc.data();
      const coachName = coachData.name || coachDoc.id;
      
      console.log(`\nChecking sessions for coach: ${coachName} (${coachDoc.id})`);
      
      // Get all sessions for this coach
      const sessionsSnapshot = await db.collection('heroCoaches')
        .doc(coachDoc.id)
        .collection('sessions')
        .get();
      
      console.log(`  Found ${sessionsSnapshot.size} total sessions`);
      
      // Check each session for 168-hour indicators
      let coach168Count = 0;
      
      sessionsSnapshot.forEach(sessionDoc => {
        const sessionData = sessionDoc.data();
        const title = sessionData.title || '';
        const filename = sessionData.filename || '';
        const type = sessionData.type || '';
        const sessionType = sessionData.sessionType || '';
        const transcript = (sessionData.transcript || '').toLowerCase();
        
        // Multiple ways to identify 168-hour sessions
        const is168Session = 
          title.includes('168') ||
          filename.includes('168') ||
          type === '168hour' ||
          type === '168-hour' ||
          sessionType === '168hour' ||
          sessionType === '168-hour' ||
          transcript.includes('168 hour') ||
          transcript.includes('168-hour') ||
          sessionData.is168Hour === true ||
          sessionData.is168HourSession === true;
        
        if (is168Session) {
          coach168Count++;
          all168Sessions.push({
            coachId: coachDoc.id,
            coachName: coachName,
            sessionId: sessionDoc.id,
            title: title,
            filename: filename,
            type: type,
            sessionType: sessionType,
            parsedCoach: sessionData.parsedCoach,
            parsedStudent: sessionData.parsedStudent,
            hasTranscript: !!sessionData.transcript,
            transcriptLength: sessionData.transcript ? sessionData.transcript.length : 0
          });
        }
      });
      
      if (coach168Count > 0) {
        console.log(`  ✓ Found ${coach168Count} 168-hour sessions`);
        total168Sessions += coach168Count;
      }
    }
    
    // Display results
    console.log('\n\n' + '='.repeat(100));
    console.log('168-HOUR SESSIONS SUMMARY');
    console.log('='.repeat(100));
    console.log(`Total 168-hour sessions found: ${total168Sessions}`);
    
    if (all168Sessions.length > 0) {
      console.log('\nDetailed list of 168-hour sessions:');
      console.log('-'.repeat(100));
      
      all168Sessions.forEach((session, index) => {
        console.log(`\n${index + 1}. Coach: ${session.coachName} (${session.coachId})`);
        console.log(`   Session ID: ${session.sessionId}`);
        console.log(`   Title: ${session.title || 'No title'}`);
        console.log(`   Filename: ${session.filename || 'No filename'}`);
        console.log(`   Type: ${session.type || 'Not set'}`);
        console.log(`   Session Type: ${session.sessionType || 'Not set'}`);
        console.log(`   Parsed Coach: ${session.parsedCoach || 'Not set'} ${session.parsedCoach === 'B' || session.parsedCoach === 'A' ? '⚠️  ISSUE' : ''}`);
        console.log(`   Parsed Student: ${session.parsedStudent || 'Not set'}`);
        console.log(`   Has Transcript: ${session.hasTranscript ? `Yes (${session.transcriptLength} chars)` : 'No'}`);
      });
      
      // Check for coach name issues
      const issuesFound = all168Sessions.filter(s => 
        s.parsedCoach === 'B' || 
        s.parsedCoach === 'A' || 
        !s.parsedCoach || 
        s.parsedCoach === 'Not set'
      );
      
      console.log('\n\nCOACH NAME ISSUES IN 168-HOUR SESSIONS:');
      console.log('='.repeat(50));
      console.log(`Sessions with coach name issues: ${issuesFound.length} out of ${all168Sessions.length} (${(issuesFound.length/all168Sessions.length*100).toFixed(1)}%)`);
      
      if (issuesFound.length > 0) {
        console.log('\nProblematic sessions:');
        issuesFound.forEach(session => {
          console.log(`- ${session.title || session.filename} | Coach: "${session.parsedCoach}" | From: ${session.coachName}`);
        });
      }
    } else {
      console.log('\nNo 168-hour sessions found in any coach\'s subcollection.');
    }
    
  } catch (error) {
    console.error('Error finding 168-hour sessions:', error);
  } finally {
    // Close the connection
    await admin.app().delete();
  }
}

// Run the search
findActual168Sessions();