# Production-Grade Firebase Reindexing Guide

This guide provides a production-ready approach to reindex your Firebase data using the Admin SDK.

## 🔐 Setup Instructions

### 1. Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `ivylevel-coach-train-auth`
3. Navigate to: **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Save the file as `serviceAccountKey.json` in your project root

### 2. Secure the Service Account Key

```bash
# Add to .gitignore immediately
echo "serviceAccountKey.json" >> .gitignore

# Verify it's ignored
git status
```

⚠️ **CRITICAL**: Never commit the service account key to version control!

### 3. Install Firebase Admin SDK

```bash
npm install firebase-admin --save
```

## 🚀 Running the Reindexing

### Option 1: Direct Execution

```bash
node scripts/reindexFirebaseAdmin.js
```

### Option 2: Add to package.json

```json
"scripts": {
  "reindex:admin": "node scripts/reindexFirebaseAdmin.js"
}
```

Then run:
```bash
npm run reindex:admin
```

## 📊 What the Script Does

### 1. **Pre-flight Checks**
- Verifies service account key exists
- Initializes Admin SDK with proper credentials
- Analyzes current data state

### 2. **Creates Backup**
- Backs up all documents to be modified
- Uses timestamped collection name: `indexed_videos_backup_YYYY-MM-DD`
- Processes in batches of 500 (Firestore limit)

### 3. **Smart Categorization**
- **Game Plans** → `game_plan_reports`
- **Execution Docs** → `execution_documents`
- **Training Materials** → `coach_resources`
- **Regular Sessions** → `student_sessions`

### 4. **Data Enrichment**
- Parses student names from titles
- Adds session types
- Timestamps all updates
- Adds data version markers

### 5. **Verification**
- Counts updated documents
- Shows category distribution
- Saves detailed report

## 🎯 Expected Output

```
🚀 Starting Production-Grade Firebase Reindexing

✅ Admin SDK initialized for project: ivylevel-coach-train-auth

📥 Fetching documents from indexed_videos...
✅ Found 865 documents

📊 Current State Analysis:
   Total documents: 865
   General Coaching (needs update): 767
   Already categorized: 98
   Other/Uncategorized: 0

💾 Creating backup to collection: indexed_videos_backup_2025-07-11
   Backed up 500/767 documents (65%)
   Backed up 767/767 documents (100%)
✅ Backup completed successfully

🔄 Reindexing documents...

   📋 Game Plan found: Gameplan & B - Week 1 (2024-03-25)
   📋 Game Plan found: Gameplan & Arshiya - Week 1 (2024-09-14)
   ...

✅ Batch 1/2 complete (500/767 documents)
✅ Batch 2/2 complete (767/767 documents)

📊 Reindexing Complete! Verifying results...

✅ Verification Results:
   Documents updated: 767
   Game Plans identified: 21

📊 New Category Distribution:
   student_sessions: 612
   game_plan_reports: 21
   execution_documents: 89
   coach_resources: 45

🎉 Reindexing completed successfully!
⏱️  Total time: 45.23 seconds
📁 Backup collection: indexed_videos_backup_2025-07-11
```

## 🔍 Post-Reindexing Verification

### 1. Check Firebase Console
```
Firestore Database → indexed_videos → 
Filter: category != "General Coaching"
```

### 2. Test Smart Onboarding
- Login as coach (Kelvin/Noor/Jamie)
- Navigate through onboarding
- Verify Abhi's Game Plan appears with real data

### 3. Query Verification
```javascript
// In Firebase Console or your app
db.collection('indexed_videos')
  .where('category', '==', 'game_plan_reports')
  .where('parsedStudent', '==', 'Arshiya')
  .get()
```

## 🛡️ Security Best Practices

### 1. Service Account Permissions
The service account should have minimal permissions:
- `roles/datastore.user` (read/write Firestore)
- No other admin permissions needed

### 2. Environment-Specific Keys
```bash
# Development
serviceAccountKey.dev.json

# Production
serviceAccountKey.prod.json

# CI/CD
Use environment variables or secret management
```

### 3. Audit Trail
All operations are logged with:
- Service account identity
- Timestamp
- Operation type
- Document IDs

## 🔄 Rollback Plan

If issues occur:

### 1. Quick Rollback
```javascript
// Copy backup data back to main collection
const backup = db.collection('indexed_videos_backup_2025-07-11');
const main = db.collection('indexed_videos');

// Process in batches...
```

### 2. Restore Specific Documents
The backup includes original data + timestamp

## 📈 Monitoring

### Check Reindex Reports
```javascript
db.collection('reindex_reports')
  .orderBy('timestamp', 'desc')
  .limit(1)
  .get()
```

### Monitor Application Logs
Watch for any errors related to:
- Missing categories
- Null student names
- Query failures

## 🚨 Troubleshooting

### "Permission Denied" Error
- Verify service account has Firestore access
- Check project ID matches

### "Cannot find module" Error
```bash
npm install firebase-admin
```

### Slow Performance
- Normal for large datasets
- Batching prevents timeouts
- Expect ~10-15 documents/second

## 🎯 Success Criteria

✅ **Reindexing successful when:**
1. No "General Coaching" categories remain
2. Game Plan sessions properly categorized
3. Smart Onboarding shows real student data
4. No application errors in production

---

**Note**: This approach is production-ready and follows Google Cloud best practices for service account usage and Firestore batch operations.