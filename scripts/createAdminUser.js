const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;
try {
  // Try root directory first
  serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
  console.log('✓ Found serviceAccountKey.json in root directory');
} catch (error) {
  try {
    // Fallback to credentials folder
    serviceAccount = require(path.join(__dirname, '..', 'credentials', 'firebase-admin.json'));
    console.log('✓ Found firebase-admin.json in credentials folder');
  } catch (error2) {
    console.error('❌ Could not find service account key file');
    console.error('   Looked for: serviceAccountKey.json (root) and credentials/firebase-admin.json');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ivylevel-coach-train-auth'
});

const auth = admin.auth();
const db = admin.firestore();

async function createOrUpdateAdminUser() {
  // You can change these values
  const email = 'admin@ivylevel.com';
  const password = 'AdminIvy2024!';
  const displayName = 'IvyLevel Admin';
  
  console.log('🔧 Setting up admin user for production Firebase...\n');
  
  try {
    let user;
    
    // Try to get existing user
    try {
      user = await auth.getUserByEmail(email);
      console.log('✓ Found existing user:', user.uid);
      
      // Update password
      await auth.updateUser(user.uid, {
        password: password,
        displayName: displayName,
        emailVerified: true
      });
      console.log('✓ Updated user password and details');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        user = await auth.createUser({
          email: email,
          password: password,
          displayName: displayName,
          emailVerified: true
        });
        console.log('✓ Created new user:', user.uid);
      } else {
        throw error;
      }
    }
    
    // Create/update Firestore document
    await db.collection('users').doc(user.uid).set({
      email: email,
      name: displayName,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✓ Updated Firestore user document\n');
    
    console.log('═'.repeat(60));
    console.log('✅ ADMIN USER READY!');
    console.log('═'.repeat(60));
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🌐 Login URL: https://ivylevel-coach-training.vercel.app/');
    console.log('═'.repeat(60));
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'auth/email-already-exists') {
      console.log('\nTry running the script again, it should update the existing user.');
    }
  }
  
  process.exit(0);
}

// Run the function
createOrUpdateAdminUser();