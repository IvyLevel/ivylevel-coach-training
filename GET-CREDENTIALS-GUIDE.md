# Step-by-Step Guide to Get Your Credentials

## Part 1: Firebase Admin SDK (firebase-admin.json)

### 1. Open Firebase Console
- Go to: https://console.firebase.google.com
- You should see your project listed (look for the one with your project ID from .env.local)
- Click on your project

### 2. Navigate to Service Accounts
- Look for the ⚙️ gear icon next to "Project Overview" (top left)
- Click on it and select **"Project settings"**
- In the top menu tabs, click on **"Service accounts"**

### 3. Generate Private Key
- You'll see a section about Firebase Admin SDK
- There's a button that says **"Generate new private key"**
- Click that button
- A popup will appear warning you to keep the key secure
- Click **"Generate key"**

### 4. Save the File
- Your browser will download a JSON file
- The filename will be something like: `your-project-name-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
- Rename this file to: `firebase-admin.json`
- Move it to: `/Users/snazir/ivylevel-coach-training/credentials/firebase-admin.json`

### 5. Verify the File
The file should look something like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "some-long-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Part 2: Google Drive API Credentials (service-account.json)

### 1. Open Google Cloud Console
- Go to: https://console.cloud.google.com
- If you haven't used Google Cloud before, you might need to:
  - Accept terms
  - It might create a default project for you

### 2. Select or Create Project
- Look at the top of the page, there's a dropdown that shows the current project
- Click on it
- You can either:
  - Select an existing project, OR
  - Click "NEW PROJECT"
  - Give it a name like "IvyLevel Coach Platform"
  - Click "CREATE"

### 3. Enable Google Drive API
- In the left sidebar, find **"APIs & Services"**
- Click on **"Library"**
- In the search box, type: **"Google Drive"**
- Click on **"Google Drive API"**
- Click the big blue **"ENABLE"** button
- Wait for it to enable (takes a few seconds)

### 4. Create Service Account
- After enabling, you should see the API dashboard
- In the left sidebar, click on **"Credentials"**
- At the top, click **"+ CREATE CREDENTIALS"**
- Select **"Service account"**

### 5. Fill Service Account Details
- **Service account name**: "IvyLevel Drive Access" (or any name you like)
- **Service account ID**: (it auto-fills based on name)
- Click **"CREATE AND CONTINUE"**
- **Grant access**: Skip this step (click "CONTINUE")
- **Grant users access**: Skip this step too (click "DONE")

### 6. Create the Key
- You'll see your new service account in the list
- Click on the service account email (looks like: name@project-id.iam.gserviceaccount.com)
- Go to the **"KEYS"** tab
- Click **"ADD KEY"** → **"Create new key"**
- Select **"JSON"**
- Click **"CREATE"**

### 7. Save the File
- Your browser will download a JSON file
- Rename this file to: `service-account.json`
- Move it to: `/Users/snazir/ivylevel-coach-training/credentials/service-account.json`

### 8. Copy the Service Account Email
- Go back to the Credentials page
- Find your service account in the list
- Copy the email address (you'll need it for the next step)
- It looks like: `something@your-project-id.iam.gserviceaccount.com`

## Part 3: Share Your Google Drive Folder

### 1. Find Your Google Drive Folder
- Go to: https://drive.google.com
- Navigate to the folder with your coaching resources
- Right-click on the folder
- Select **"Share"**

### 2. Share with Service Account
- In the "Add people and groups" field
- Paste the service account email you copied
- Make sure it's set to **"Viewer"** (read-only access)
- Uncheck "Notify people" (service accounts don't need emails)
- Click **"Share"**

### 3. Get the Folder ID
- Open the folder in Google Drive
- Look at the URL in your browser
- It will look like: `https://drive.google.com/drive/folders/XXXXXXXXXXXXX`
- The part after `/folders/` is your folder ID
- Copy this ID

### 4. Update Your Environment File
- Open `/Users/snazir/ivylevel-coach-training/.env.local`
- Find the line: `GOOGLE_DRIVE_ROOT_FOLDER_ID=`
- Add your folder ID: `GOOGLE_DRIVE_ROOT_FOLDER_ID=XXXXXXXXXXXXX`

## Final Check

After completing these steps, you should have:
```
credentials/
├── firebase-admin.json    ✓
└── service-account.json   ✓
```

Now you can run:
```bash
# Test that everything works
npm run test:integration

# If tests pass, initialize your database
npm run setup
```

## Troubleshooting

### "Permission denied" errors?
- Make sure you shared the Google Drive folder with the service account email
- Check that the folder ID in .env.local is correct

### "API not enabled" errors?
- Go back to Google Cloud Console
- Make sure Google Drive API shows as "Enabled"

### Can't find something?
- Firebase Console: Make sure you're in the right project
- Google Cloud Console: Check the project dropdown at the top

Need help? The specific location of buttons might vary slightly, but the general flow remains the same!