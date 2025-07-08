# Credentials Directory

This directory should contain your service account credentials:

1. **service-account.json** - Google Cloud service account key for Google Drive API
2. **firebase-admin.json** - Firebase Admin SDK service account key

## How to obtain these files:

### Google Drive Service Account:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Drive API
4. Go to "IAM & Admin" > "Service Accounts"
5. Create a new service account
6. Download the JSON key and save as `service-account.json`

### Firebase Admin SDK:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download and save as `firebase-admin.json`

**IMPORTANT**: Never commit these files to version control!