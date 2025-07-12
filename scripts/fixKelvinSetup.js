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

const fixKelvinSetup = async () => {
  console.log('Fixing Kelvin\'s coach setup...\n');
  
  try {
    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail('coach1@ivymentors.co');
    const uid = userRecord.uid;
    console.log('Found user with UID:', uid);
    
    // First, find the coach document that was just created (it might have a different ID)
    const recentCoaches = await db.collection('coaches')
      .orderBy('provisionedAt', 'desc')
      .limit(5)
      .get();
    
    let kelvinCoachDoc = null;
    console.log('\nLooking for recently provisioned coaches...');
    
    recentCoaches.forEach(doc => {
      const data = doc.data();
      const provisionedTime = data.provisionedAt ? new Date(data.provisionedAt).toLocaleString() : 'Unknown';
      console.log(`- ${data.name} (${data.email}) - provisioned at ${provisionedTime}`);
      // Check for Kelvin by name or by similar email
      if (data.name && data.name.toLowerCase().includes('kelvin')) {
        kelvinCoachDoc = { id: doc.id, data: data };
        console.log('  ^ Found Kelvin!');
      }
    });
    
    if (!kelvinCoachDoc) {
      console.log('\n❌ Could not find Kelvin\'s coach document');
      console.log('Please make sure you completed the provisioning process');
      process.exit(1);
    }
    
    console.log(`\n✓ Found Kelvin's coach profile (ID: ${kelvinCoachDoc.id})`);
    
    // Now we need to:
    // 1. Move the coach document to use the correct UID
    // 2. Update the user document with correct status
    
    console.log('\nFixing the setup...');
    
    // Copy the coach document to the correct ID (the user's UID)
    // Also fix the email to match the login email
    await db.collection('coaches').doc(uid).set({
      ...kelvinCoachDoc.data,
      uid: uid,
      email: 'coach1@ivymentors.co' // Fix the email to match login
    });
    console.log('✓ Created coach document with correct UID');
    
    // Delete the old coach document if it's different
    if (kelvinCoachDoc.id !== uid) {
      await db.collection('coaches').doc(kelvinCoachDoc.id).delete();
      console.log('✓ Removed duplicate coach document');
    }
    
    // Update the user document
    await db.collection('users').doc(uid).update({
      status: 'provisioned',
      name: kelvinCoachDoc.data.name || 'Kelvin',
      role: 'coach'
    });
    console.log('✓ Updated user document with provisioned status');
    
    // Make sure onboardingStarted is not set
    await db.collection('users').doc(uid).update({
      onboardingStarted: admin.firestore.FieldValue.delete()
    });
    await db.collection('coaches').doc(uid).update({
      onboardingStarted: admin.firestore.FieldValue.delete()
    });
    console.log('✓ Cleared any existing onboarding flags');
    
    console.log('\n' + '='.repeat(50));
    console.log('SUCCESS! Kelvin\'s setup is fixed.');
    console.log('='.repeat(50));
    console.log('\nNext steps:');
    console.log('1. Have Kelvin logout (click Logout button)');
    console.log('2. Login again with coach1@ivymentors.co');
    console.log('3. He should now see the welcome experience!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
};

fixKelvinSetup();