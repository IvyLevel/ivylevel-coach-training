const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
} catch (error) {
  try {
    serviceAccount = require(path.join(__dirname, '..', 'credentials', 'firebase-admin.json'));
  } catch (error2) {
    console.error('Could not find service account key file');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ivylevel-coach-train-auth'
});

const auth = admin.auth();
const db = admin.firestore();

const demoCoaches = [
  {
    email: 'kelvin@ivylevel.com',
    password: 'Coach123!',
    name: 'Kelvin Nguyen',
    role: 'coach',
    status: 'active',
    background: 'Test Prep',
    experience: '5',
    strengths: ['Student Rapport', 'SAT/ACT Prep', 'Organization'],
    gaps: ['Elite College Process', 'Essay Techniques']
  },
  {
    email: 'noor@ivylevel.com',
    password: 'Coach123!',
    name: 'Noor Patel',
    role: 'coach',
    status: 'active',
    background: 'College Admissions',
    experience: '3',
    strengths: ['Essay Coaching', 'Parent Communication'],
    gaps: ['SAT Strategy', 'Athletic Recruitment']
  },
  {
    email: 'jamie@ivylevel.com',
    password: 'Coach123!',
    name: 'Jamie Thompson',
    role: 'coach',
    status: 'active',
    background: 'High School Counselor',
    experience: '7',
    strengths: ['Student Rapport', 'Organization', 'Parent Communication'],
    gaps: ['Elite College Process', 'Financial Aid']
  }
];

async function createDemoCoaches() {
  console.log('🎭 Creating demo coach accounts...\n');
  
  for (const coach of demoCoaches) {
    try {
      let user;
      
      // Try to get existing user
      try {
        user = await auth.getUserByEmail(coach.email);
        console.log(`✓ Found existing user: ${coach.email}`);
        
        // Update password
        await auth.updateUser(user.uid, {
          password: coach.password,
          displayName: coach.name,
          emailVerified: true
        });
        console.log(`  Updated password and details`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new user
          user = await auth.createUser({
            email: coach.email,
            password: coach.password,
            displayName: coach.name,
            emailVerified: true
          });
          console.log(`✓ Created new user: ${coach.email}`);
        } else {
          throw error;
        }
      }
      
      // Create/update user document
      await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: coach.email,
        name: coach.name,
        role: coach.role,
        status: coach.status,
        onboardingStarted: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Create coach profile
      const coachProfile = {
        email: coach.email,
        name: coach.name,
        role: coach.role,
        status: coach.status,
        background: coach.background,
        experience: coach.experience,
        strengths: coach.strengths,
        gaps: coach.gaps,
        provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        learningPath: {
          track: 'standard',
          currentModule: 0,
          completedVideos: [],
          startDate: new Date().toISOString()
        }
      };
      
      const coachesQuery = await db.collection('coaches').where('email', '==', coach.email).get();
      if (coachesQuery.empty) {
        const coachDocRef = await db.collection('coaches').add(coachProfile);
        console.log(`  Created coach profile: ${coachDocRef.id}`);
        
        // Update user doc with coachId
        await db.collection('users').doc(user.uid).update({
          coachId: coachDocRef.id
        });
      } else {
        console.log(`  Coach profile already exists`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Error with ${coach.email}:`, error.message);
    }
  }
  
  console.log('═'.repeat(60));
  console.log('✅ DEMO COACHES READY!');
  console.log('═'.repeat(60));
  console.log('\nDemo Accounts:');
  demoCoaches.forEach(coach => {
    console.log(`\n${coach.name}:`);
    console.log(`  Email: ${coach.email}`);
    console.log(`  Password: ${coach.password}`);
  });
  console.log('\nAdmin Account:');
  console.log('  Email: admin@ivylevel.com');
  console.log('  Password: AdminIvy2024!');
  console.log('═'.repeat(60));
  
  process.exit(0);
}

createDemoCoaches();