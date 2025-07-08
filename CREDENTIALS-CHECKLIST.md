# Credentials Checklist

## 📋 Firebase Admin SDK

### Where to go:
1. [ ] Open https://console.firebase.google.com
2. [ ] Click on your project
3. [ ] Click ⚙️ → "Project settings"
4. [ ] Click "Service accounts" tab
5. [ ] Click "Generate new private key"
6. [ ] Click "Generate key" in popup
7. [ ] Save downloaded file as `credentials/firebase-admin.json`

### What you're looking for:
- A JSON file that starts with `{"type": "service_account"...`
- Contains your `project_id`
- Has a long `private_key` field

---

## 📁 Google Drive API

### Part A - Enable API & Create Service Account:
1. [ ] Open https://console.cloud.google.com
2. [ ] Select/create a project
3. [ ] Click "APIs & Services" → "Library"
4. [ ] Search "Google Drive"
5. [ ] Click "Google Drive API"
6. [ ] Click "ENABLE"
7. [ ] Click "Credentials" in left menu
8. [ ] Click "+ CREATE CREDENTIALS" → "Service account"
9. [ ] Name it (e.g., "IvyLevel Drive")
10. [ ] Click "CREATE AND CONTINUE"
11. [ ] Click "CONTINUE" (skip role)
12. [ ] Click "DONE"

### Part B - Download Key:
13. [ ] Click on the service account email
14. [ ] Go to "KEYS" tab
15. [ ] Click "ADD KEY" → "Create new key"
16. [ ] Choose "JSON"
17. [ ] Click "CREATE"
18. [ ] Save downloaded file as `credentials/service-account.json`

### Part C - Share Drive Folder:
19. [ ] Copy the service account email (from step 13)
20. [ ] Go to https://drive.google.com
21. [ ] Right-click your resources folder → "Share"
22. [ ] Paste service account email
23. [ ] Set to "Viewer"
24. [ ] Uncheck "Notify people"
25. [ ] Click "Share"

### Part D - Get Folder ID:
26. [ ] Open the shared folder
27. [ ] Copy ID from URL: `drive.google.com/drive/folders/[THIS_PART]`
28. [ ] Add to .env.local: `GOOGLE_DRIVE_ROOT_FOLDER_ID=...`

---

## ✅ Final Verification

Run this command to check:
```bash
npm run test:integration
```

You should see:
- ✅ Firebase connection
- ✅ Google Drive API initialized
- ✅ Other services working

Then initialize your database:
```bash
npm run setup
```

---

## 🆘 Common Issues

**"File not found" error?**
- Make sure files are in `/credentials/` folder
- Check file names are exactly: `firebase-admin.json` and `service-account.json`

**"Permission denied" for Google Drive?**
- Did you share the folder with the service account email?
- Is the email exactly as shown in Google Cloud Console?
- Try removing and re-adding the share

**Project ID mismatch?**
- The project_id in firebase-admin.json should match REACT_APP_FIREBASE_PROJECT_ID in .env.local