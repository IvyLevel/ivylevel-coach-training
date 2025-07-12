// Script to create admin user in production Firebase
// Run this locally: node scripts/createProductionAdmin.js

const admin = require('firebase-admin');
const serviceAccount = require('../credentials/firebase-admin.json');

// Initialize admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ivylevel-coach-train-auth'
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  const email = 'admin@ivylevel.com';
  const password = 'AdminIvy2024!'; // Change this to a secure password
  const displayName = 'IvyLevel Admin';
  
  try {
    // Create auth user
    let user;
    try {
      user = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName,
        emailVerified: true
      });
      console.log('✅ Created new admin user:', user.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        // Get existing user
        user = await auth.getUserByEmail(email);
        console.log('ℹ️ Admin user already exists:', user.uid);
        
        // Update password
        await auth.updateUser(user.uid, {
          password: password
        });
        console.log('✅ Updated admin password');
      } else {
        throw error;
      }
    }
    
    // Create/update Firestore user document
    await db.collection('users').doc(user.uid).set({
      email: email,
      name: displayName,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Created/updated Firestore user document');
    
    console.log('\n📋 Admin Credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n🌐 Login at: https://ivylevel-coach-training.vercel.app/');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();