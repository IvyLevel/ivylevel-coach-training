const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyze168InCoachingSessions() {
  console.log('Analyzing 168-hour sessions in coaching_sessions collection...\n');
  
  try {
    // First, let's find all documents that mention 168
    const allSessions = await db.collection('coaching_sessions').get();
    console.log(`Total documents in coaching_sessions: ${allSessions.size}\n`);
    
    const sessions168 = [];
    
    allSessions.forEach(doc => {
      const data = doc.data();
      
      // Check various fields for 168 mentions
      const searchFields = [
        data.title || '',
        data.originalFileName || '',
        data.description || '',
        data.type || '',
        JSON.stringify(data.tags || []),
        data.criticalSessionType || ''
      ].join(' ').toLowerCase();
      
      if (searchFields.includes('168')) {
        sessions168.push({
          id: doc.id,
          data: data
        });
      }
    });
    
    console.log(`Found ${sessions168.length} sessions mentioning "168"\n`);
    
    // Analyze each 168-hour session
    console.log('DETAILED ANALYSIS OF 168-HOUR SESSIONS:');
    console.log('=' .repeat(100));
    
    sessions168.forEach((session, index) => {
      const data = session.data;
      
      console.log(`\n${index + 1}. Document ID: ${session.id}`);
      console.log('-'.repeat(100));
      console.log(`Title: ${data.title || 'No title'}`);
      console.log(`Original Filename: ${data.originalFileName || 'No filename'}`);
      console.log(`Description: ${data.description || 'No description'}`);
      console.log(`Type: ${data.type || 'Not set'}`);
      console.log(`Critical Session Type: ${data.criticalSessionType || 'Not set'}`);
      
      // Check participants
      if (data.participants) {
        console.log(`\nParticipants:`);
        console.log(`  Coach: ${data.participants.coach || 'Not set'} ${data.participants.coach === 'B' || data.participants.coach === 'A' ? '⚠️  ISSUE' : ''}`);
        console.log(`  Student: ${data.participants.student || 'Not set'}`);
        console.log(`  Coach (normalized): ${data.participants.coachNormalized || 'Not set'}`);
        console.log(`  Student (normalized): ${data.participants.studentNormalized || 'Not set'}`);
      }
      
      // Check extraction info
      if (data.extractionInfo) {
        console.log(`\nExtraction Info:`);
        console.log(`  Raw: ${data.extractionInfo.raw || 'Not set'}`);
        console.log(`  Coach: ${data.extractionInfo.coach || 'Not set'} ${data.extractionInfo.coach === 'B' || data.extractionInfo.coach === 'A' ? '⚠️  ISSUE' : ''}`);
        console.log(`  Student: ${data.extractionInfo.student || 'Not set'}`);
        console.log(`  Session Type: ${data.extractionInfo.sessionType || 'Not set'}`);
      }
      
      console.log(`\nTags: ${JSON.stringify(data.tags || [])}`);
      console.log(`Is Required for Onboarding: ${data.isRequiredForOnboarding || false}`);
      console.log(`Priority: ${data.priority || 'Not set'}`);
    });
    
    // Summary of coach name issues
    console.log('\n\nSUMMARY OF COACH NAME ISSUES IN 168-HOUR SESSIONS:');
    console.log('=' .repeat(80));
    
    const issueCount = sessions168.filter(session => {
      const coach = session.data.participants?.coach || session.data.extractionInfo?.coach || '';
      return coach === 'B' || coach === 'A' || coach.length <= 2;
    }).length;
    
    console.log(`Total 168-hour sessions: ${sessions168.length}`);
    console.log(`Sessions with coach name issues: ${issueCount}`);
    console.log(`Percentage with issues: ${sessions168.length > 0 ? (issueCount/sessions168.length*100).toFixed(1) : 0}%`);
    
    // List all unique coach names found
    const coachNames = new Set();
    sessions168.forEach(session => {
      if (session.data.participants?.coach) {
        coachNames.add(session.data.participants.coach);
      }
      if (session.data.extractionInfo?.coach) {
        coachNames.add(session.data.extractionInfo.coach);
      }
    });
    
    console.log(`\nUnique coach names in 168-hour sessions: ${Array.from(coachNames).join(', ')}`);
    
  } catch (error) {
    console.error('Error analyzing coaching sessions:', error);
  } finally {
    // Close the connection
    await admin.app().delete();
  }
}

// Run the analysis
analyze168InCoachingSessions();