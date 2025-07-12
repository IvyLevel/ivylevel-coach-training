const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ivylevel-coach-train-auth'
});

const auth = admin.auth();
const db = admin.firestore();

async function debugAuth() {
  console.log('🔍 Debugging Authentication Issues\n');
  
  const email = 'admin@ivylevel.com';
  
  try {
    // Check if user exists
    console.log('1. Checking if user exists...');
    const user = await auth.getUserByEmail(email);
    console.log('✓ User found:');
    console.log('  - UID:', user.uid);
    console.log('  - Email:', user.email);
    console.log('  - Email Verified:', user.emailVerified);
    console.log('  - Disabled:', user.disabled);
    console.log('  - Created:', new Date(user.metadata.creationTime).toLocaleString());
    
    // Check Firestore document
    console.log('\n2. Checking Firestore document...');
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      console.log('✓ Firestore document found:');
      const data = userDoc.data();
      console.log('  - Name:', data.name);
      console.log('  - Role:', data.role);
      console.log('  - Email:', data.email);
    } else {
      console.log('❌ No Firestore document found for user');
    }
    
    // Reset password to ensure it's correct
    console.log('\n3. Resetting password to ensure it\'s correct...');
    await auth.updateUser(user.uid, {
      password: 'AdminIvy2024!'
    });
    console.log('✓ Password has been reset to: AdminIvy2024!');
    
    // List all users to see what's in the system
    console.log('\n4. Listing all users in the system:');
    const listResult = await auth.listUsers(10);
    listResult.users.forEach((userRecord) => {
      console.log(`  - ${userRecord.email} (${userRecord.uid}) - Created: ${new Date(userRecord.metadata.creationTime).toLocaleDateString()}`);
    });
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('✅ AUTHENTICATION DEBUG COMPLETE');
    console.log('════════════════════════════════════════════════════════════');
    console.log('Try logging in again with:');
    console.log('Email: admin@ivylevel.com');
    console.log('Password: AdminIvy2024!');
    console.log('URL: https://ivylevel-coach-training.vercel.app/');
    console.log('════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
  }
  
  process.exit(0);
}

debugAuth();