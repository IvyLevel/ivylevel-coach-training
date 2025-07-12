const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = require(path.join(__dirname, '..', 'credentials', 'firebase-admin.json'));
} catch (error) {
  try {
    serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
  } catch (error2) {
    console.error('Could not find service account key file');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ivylevel-coach-train-auth'
});

const setUserPassword = async (email, password) => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, {
      password: password
    });
    console.log(`✓ Password updated for ${email} (UID: ${user.uid})`);
    return true;
  } catch (error) {
    console.error(`✗ Error updating password for ${email}:`, error.message);
    return false;
  }
};

// Set passwords for your users
const updatePasswords = async () => {
  console.log('Setting passwords for existing Firebase users...\n');
  
  // Set the same temporary password for all users
  const tempPassword = 'Testing123!';
  
  const users = [
    'admin@ivylevel.com',
    'snazir@ivylevel.com', // Add your email here
    'coach1@ivylevel.com',
    'coach2@ivylevel.com'
  ];
  
  for (const email of users) {
    await setUserPassword(email, tempPassword);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('IMPORTANT: Temporary passwords have been set!');
  console.log('='.repeat(50));
  console.log(`All users can now login with password: ${tempPassword}`);
  console.log('Users should change their passwords after first login.');
  console.log('='.repeat(50) + '\n');
  
  process.exit(0);
};

// Run the password update
updatePasswords().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});