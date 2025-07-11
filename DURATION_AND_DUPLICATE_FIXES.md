# Duration Display and Duplicate Entry Fixes

## Issues Identified

### 1. Duration Display Issue
- **Problem**: Videos showing "5h 0m" instead of "5m"
- **Cause**: The duration is stored as "5:00" in the database, which was being interpreted as hours:minutes instead of minutes:seconds
- **Data Format**: The import scripts store duration as `minutes:00` format (e.g., "5:00" means 5 minutes)

### 2. Duplicate Entries
- **Problem**: Multiple documents with the same filename and driveId in the database
- **Impact**: When filtering by 168-hour or Game Plan, users see duplicate videos
- **Examples**: Found 865 total documents with many duplicates (e.g., some videos have 2-4 copies)

## Solutions Implemented

### 1. Fixed Duration Display (ModernKnowledgeBase_Fixed.js)

Updated the `formatDuration` function to correctly interpret the duration format:

```javascript
const formatDuration = (duration) => {
  if (!duration) return '30m';
  
  // Handle default case
  if (duration === '30:00') return '30m';
  
  // Parse duration string
  const parts = duration.split(':');
  if (parts.length >= 2) {
    const firstPart = parseInt(parts[0]);
    const secondPart = parseInt(parts[1]);
    
    // Check if it's likely minutes:seconds format (when first part is small)
    // Most videos are under 60 minutes, so if first part is < 60, assume it's minutes
    if (firstPart < 60) {
      // This is minutes:seconds format
      return `${firstPart}m`;
    } else {
      // This might be hours:minutes format (for very long videos)
      const hours = Math.floor(firstPart / 60);
      const minutes = firstPart % 60;
      if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
      return `${firstPart}m`;
    }
  }
  
  // If just a number, assume minutes
  const minutes = parseInt(duration);
  if (!isNaN(minutes)) {
    return `${minutes}m`;
  }
  
  return duration;
};
```

### 2. Fixed Duplicate Display (ModernKnowledgeBase_Fixed.js)

Added deduplication logic in the `loadVideos` function:

```javascript
// Use a Map to track unique videos by driveId
const uniqueVideos = new Map();

// ... processing logic ...

// Only add if we haven't seen this driveId before (deduplication)
if (driveId && !uniqueVideos.has(driveId)) {
  uniqueVideos.set(driveId, videoData);
} else if (!driveId) {
  // If no driveId, use filename as unique key
  const uniqueKey = `${filename}_${doc.id}`;
  if (!uniqueVideos.has(uniqueKey)) {
    uniqueVideos.set(uniqueKey, videoData);
  }
}

// Convert Map values to array
const videoData = Array.from(uniqueVideos.values());
```

### 3. Database Cleanup Script (removeDuplicates.js)

Created a script to identify and remove duplicate documents from the database:
- Groups documents by driveId
- Keeps the first occurrence, marks others for deletion
- Currently in DRY RUN mode for safety
- Shows what would be deleted before actual deletion

## Implementation Steps

1. **Replace the component**:
   ```bash
   mv src/components/ModernKnowledgeBase.js src/components/ModernKnowledgeBase_backup.js
   mv src/components/ModernKnowledgeBase_Fixed.js src/components/ModernKnowledgeBase.js
   ```

2. **Test the fixes**:
   - Duration should now show correctly (e.g., "5m" instead of "5h 0m")
   - No duplicate videos should appear when filtering

3. **Clean the database** (optional):
   ```bash
   # First run in dry mode to see what would be deleted
   node scripts/removeDuplicates.js
   
   # If satisfied, edit the script to uncomment deletion code and run again
   ```

## Verification

To verify the fixes work:
1. Check that videos show proper duration (5m, 30m, etc.)
2. Filter by 168-hour sessions - should see no duplicates
3. Filter by Game Plan - should see no duplicates
4. Run `node scripts/checkDuplicatesSimple.js` to verify duplicate counts

## Notes

- The duration fix assumes videos under 60 minutes use "minutes:seconds" format
- The deduplication prioritizes driveId as the unique identifier
- The database cleanup is optional but recommended for data consistency