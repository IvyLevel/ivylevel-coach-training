const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const checkKelvinStatus = async () => {
  console.log('Checking Kelvin\'s setup...\n');
  
  try {
    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail('coach1@ivymentors.co');
    console.log('Firebase Auth User:');
    console.log('- UID:', userRecord.uid);
    console.log('- Email:', userRecord.email);
    console.log('- Created:', new Date(userRecord.metadata.creationTime).toLocaleString());
    console.log('');
    
    // Check users collection
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (userDoc.exists) {
      console.log('Users Collection Document:');
      const userData = userDoc.data();
      console.log('- Role:', userData.role);
      console.log('- Name:', userData.name);
      console.log('- Status:', userData.status);
      console.log('- Onboarding Started:', userData.onboardingStarted || 'Not started');
    } else {
      console.log('❌ No document in users collection');
    }
    console.log('');
    
    // Check coaches collection
    const coachDocs = await db.collection('coaches').where('email', '==', 'coach1@ivymentors.co').get();
    if (!coachDocs.empty) {
      console.log('Coaches Collection Document(s):');
      coachDocs.forEach(doc => {
        const coachData = doc.data();
        console.log('- Document ID:', doc.id);
        console.log('- Name:', coachData.name);
        console.log('- Status:', coachData.status);
        console.log('- Provisioned At:', coachData.provisionedAt);
        console.log('- Onboarding Started:', coachData.onboardingStarted || 'Not started');
        console.log('- Strengths:', coachData.strengths);
        console.log('- Gaps:', coachData.gaps);
      });
    } else {
      console.log('❌ No document in coaches collection');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('DIAGNOSIS:');
    console.log('='.repeat(50));
    
    // Determine the issue
    if (!userDoc.exists) {
      console.log('Issue: User document missing in users collection');
      console.log('Solution: The app will create it on first login');
    } else if (userData.status !== 'provisioned') {
      console.log('Issue: User status is not "provisioned"');
      console.log('Solution: Need to update user status to "provisioned"');
    } else if (userData.onboardingStarted) {
      console.log('Issue: Onboarding already started');
      console.log('Solution: Need to reset onboarding status');
    } else {
      console.log('✅ Everything looks correct! User should see welcome screen.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
};

checkKelvinStatus();