# Firebase Rules Update Required

The reindexing worked successfully, but the web app can't read the data due to Firebase security rules.

## Current Issue
```
Error: Missing or insufficient permissions
Collection: indexed_videos
```

## Required Firebase Rules Update

Go to Firebase Console → Firestore Database → Rules and add these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to indexed_videos collection
    match /indexed_videos/{document} {
      allow read: if true;  // Public read access
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Allow read access to game plan reports
    match /game_plan_reports/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Allow read access to execution docs
    match /execution_documents/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Existing rules for users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }
    
    // Keep other existing rules...
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Why This Is Needed

1. The Smart Onboarding system needs to read indexed_videos BEFORE user authentication
2. Game Plan data needs to be accessible during onboarding
3. The current rules require authentication, but onboarding happens pre-auth

## Alternative: Authenticated Read Only

If you prefer more security, use this instead:

```javascript
match /indexed_videos/{document} {
  allow read: if request.auth != null;  // Requires authentication
  allow write: if request.auth != null && request.auth.token.admin == true;
}
```

But then you'll need to ensure users are authenticated before Smart Onboarding.

## Steps to Apply:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `ivylevel-coach-train-auth`
3. Navigate to Firestore Database → Rules
4. Replace with the rules above
5. Click "Publish"
6. Wait 1-2 minutes for propagation
7. Refresh your app and test again