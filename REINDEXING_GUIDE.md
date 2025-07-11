# Firebase Knowledge Base Reindexing Guide

This guide will help you reindex your Firebase data to match your actual Knowledge Base structure instead of the current "General Coaching" categorization.

## 🎯 What This Process Does

1. **Analyzes** your current Firebase `indexed_videos` collection
2. **Parses** filenames using your actual naming convention: `[Category]_[Source]_[Coach]_[Student]_[Week]_[Date]_M_[MeetingID]U_[UUID]`
3. **Maps** sessions to correct categories based on your folder structure:
   - Coaches/ → `coach_resources`
   - Students/ → `student_sessions`
   - Execution Docs/ → `execution_documents`
   - Game Plan Reports/ → `game_plan_reports`
   - Miscellaneous/ → `miscellaneous`
   - Trivial/ → `miscellaneous`
4. **Enriches** data with proper tags, student/coach identifiers, and session types
5. **Creates** a backup before making changes
6. **Validates** the results

## 🚀 Step-by-Step Instructions

### Pre-Reindexing Checks

1. **Check Firebase Connection**
   ```bash
   # Make sure you're in the project directory
   cd /path/to/ivylevel-coach-training
   
   # Verify Firebase connection
   npm run check:setup
   ```

2. **Review Current Data**
   ```bash
   # Optional: Check current data quality
   npm run quality:report
   ```

### Run the Reindexing Process

3. **Start Reindexing**
   ```bash
   # Run the complete reindexing process
   npm run reindex:firebase
   ```

   This will:
   - Create a backup in `indexed_videos_backup` collection
   - Process all documents in `indexed_videos`
   - Update categories, tags, and metadata
   - Generate a detailed report

4. **Validate Results**
   ```bash
   # Run validation to check results
   npm run reindex:validate
   ```

### Monitor the Process

During reindexing, you'll see:
- 📥 Document fetching progress
- 💾 Backup creation confirmation
- 🔄 Processing updates (every 100 documents)
- ✅ Completion summary with statistics

### Example Output

```
🔄 Starting Firebase data reindexing...
📥 Fetching current indexed_videos...
📊 Found 756 documents to reindex
💾 Creating backup of current data...
✅ Backup created successfully
🔄 Processing documents...
📈 Processed 100/756 documents
📈 Processed 200/756 documents
...
📈 Processed 756/756 documents
💾 Committing updates...
📊 Generating summary report...
✅ Reindexing completed successfully!
📊 Summary Report:
   Total documents: 756
   Processed: 756
   Category breakdown: {
     "student_sessions": 534,
     "game_plan_reports": 87,
     "execution_documents": 92,
     "coach_resources": 28,
     "miscellaneous": 15
   }
```

## 🔍 What to Check After Reindexing

### 1. Firebase Console
- Go to Firebase Console → Firestore Database
- Check `indexed_videos` collection
- Verify documents have:
  - Updated `category` field (not "General Coaching")
  - `reindexedAt` timestamp
  - Enhanced `tags` array
  - `sessionType` classification

### 2. Smart Onboarding System
- Test the Smart Onboarding flow
- Check if Abhi's Game Plan data appears correctly
- Verify video and report links work

### 3. Data Quality
```bash
# Run quality check after reindexing
npm run quality:report
```

## 📊 Expected Results

After successful reindexing:

### Categories Should Change From:
- ❌ "General Coaching" (generic)

### To:
- ✅ `student_sessions` - Regular coaching sessions
- ✅ `game_plan_reports` - Game Plan assessments and reports
- ✅ `execution_documents` - Execution docs and follow-ups
- ✅ `coach_resources` - Training materials for coaches
- ✅ `miscellaneous` - Other files

### Enhanced Data Fields:
- `parsedCoach` - Coach name from filename
- `parsedStudent` - Student name from filename
- `parsedWeek` - Week number from filename
- `sessionType` - Classified session type
- `studentIdentifiers` - Array of student name variants
- `coachIdentifiers` - Array of coach name variants
- `tags` - Enhanced tagging system

## 🐛 Troubleshooting

### Common Issues:

1. **Firebase Permission Errors**
   ```bash
   # Check if you're authenticated
   firebase login
   ```

2. **Missing Environment Variables**
   ```bash
   # Check if .env file exists with Firebase config
   ls -la .env
   ```

3. **Network/Timeout Issues**
   - The process handles large datasets, be patient
   - Check Firebase quotas in console

4. **Validation Failures**
   - Run validation separately: `npm run reindex:validate`
   - Check the issues reported and fix manually if needed

### Recovery Options:

If something goes wrong:
1. **Restore from backup**: The `indexed_videos_backup` collection contains your original data
2. **Re-run reindexing**: The process is idempotent - safe to run multiple times
3. **Manual fixes**: Address specific issues found during validation

## 📈 Success Metrics

✅ **Successful Reindexing When:**
- Validation shows 90%+ success rate
- Smart Onboarding displays Abhi's actual Game Plan data
- Categories reflect your actual Knowledge Base structure
- Session types are properly classified

## 🎯 Next Steps After Reindexing

1. **Test Smart Onboarding**
   - Login with coach account
   - Go through Smart Onboarding flow
   - Verify Abhi's Game Plan appears with real data

2. **Verify Game Plan Videos**
   - Check if video iframe loads correctly
   - Ensure Game Plan reports are accessible

3. **Monitor Data Quality**
   - Set up regular quality checks
   - Monitor for any data inconsistencies

4. **Update Search/Filter Logic**
   - Update any hardcoded category filters
   - Enhance search to use new categorization

## 📞 Support

If you encounter issues:
1. Check the validation report for specific problems
2. Review Firebase console for error messages
3. Run `npm run quality:report` for detailed analysis
4. The backup collection preserves your original data

---

**Important**: This process creates a backup before making changes. Your original data is safe in the `indexed_videos_backup` collection.