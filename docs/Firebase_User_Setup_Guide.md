# Firebase User Setup Guide

## Setting Passwords for Existing Users

### Option 1: Firebase Console Password Reset (Recommended)
1. Go to Firebase Console > Authentication
2. Find the user (e.g., `admin@ivymentors.co`)
3. Click on the 3 dots menu (⋮) on the right
4. Select "Reset password"
5. Firebase will send a password reset email to the user

### Option 2: Admin SDK Password Update
If you want to set passwords programmatically, create this script:

```javascript
// scripts/setUserPasswords.js
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const setUserPassword = async (email, password) => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, {
      password: password
    });
    console.log(`Password updated for ${email}`);
  } catch (error) {
    console.error(`Error updating password for ${email}:`, error);
  }
};

// Set passwords for your users
const updatePasswords = async () => {
  await setUserPassword('admin@ivymentors.co', 'TempPass123!');
  await setUserPassword('coach1@ivymentors.co', 'TempPass123!');
  await setUserPassword('coach2@ivymentors.co', 'TempPass123!');
  
  console.log('\nIMPORTANT: These are temporary passwords!');
  console.log('Users should change them on first login.');
  
  process.exit(0);
};

updatePasswords();
```

### Option 3: Delete and Recreate (Quick Testing)
For quick testing, you can:
1. Delete the user in Firebase Console
2. Recreate with the same email and set a password
3. The app will auto-create their user document on first login

## Understanding Firebase Users

### What You're Seeing:
- **UID**: Unique identifier (e.g., `waEoMzBQWXVBxqcTLixslK8B1qy1`)
- **Email**: User's email address
- **No Password**: Firebase doesn't show passwords for security

### How Firebase Auth Works:
1. Passwords are never visible in the console (security feature)
2. Users can only set passwords via:
   - Initial creation
   - Password reset email
   - Admin SDK update
   - User's own password change

## Quick Test Setup

For immediate testing, here's the fastest approach:

### 1. Create Test Admin
```bash
# In Firebase Console > Authentication > Add user
Email: admin@ivylevel.com
Password: testing123
```

### 2. Create Test Coach
```bash
# After admin provisions a coach, create their auth account
Email: [coach email from provisioning]
Password: testing123
```

## Testing Flow

### As Admin:
1. Login with `admin@ivylevel.com` / `testing123`
2. Click "Add New Coach"
3. Fill form with:
   - Name: Sarah Johnson
   - Email: sarah.johnson@test.com
   - Background: High School Counselor
   - Experience: 3 years
   - Strengths: Student Rapport, Organization
   - Gaps: SAT Strategies, Elite Admissions
4. Click "Analyze with AI"
5. Click "Approve & Provision"

### As Coach:
1. Create auth user `sarah.johnson@test.com` / `testing123` in Firebase
2. Login as Sarah
3. See personalized welcome experience
4. Complete 4-step onboarding

## Security Best Practices

### For Development:
- Use simple passwords like `testing123`
- Reset frequently
- Don't use real user data

### For Production:
1. Implement password requirements:
   - Minimum 8 characters
   - Mix of letters, numbers, symbols
   - No common passwords

2. Add to your app:
   ```javascript
   // Force password change on first login
   if (user.metadata.creationTime === user.metadata.lastSignInTime) {
     // Redirect to password change
   }
   ```

3. Enable 2FA in Firebase Console

## Troubleshooting

### "User not found" error:
- Ensure email matches exactly (case-sensitive)
- Check you're in the right Firebase project

### "Wrong password" error:
- Send password reset email
- Or delete and recreate user

### Coach doesn't see welcome screen:
1. Check Firestore > coaches collection
2. Ensure coach document has `status: "provisioned"`
3. Ensure `onboardingStarted` field doesn't exist

## Next Steps

1. Set passwords for your existing users using Option 1 (reset email)
2. Test the admin provisioning flow
3. Test the coach welcome experience
4. Document any issues for troubleshooting