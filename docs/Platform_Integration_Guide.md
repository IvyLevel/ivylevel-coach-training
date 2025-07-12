# IvyLevel Platform Integration Guide

## Overview
This guide explains how to integrate the Smart Coach Onboarding platform with your main IvyLevel platform.

## Admin Dashboard Features

### 1. Coach Readiness Tracking
The admin dashboard now provides comprehensive visibility into:

- **Overall Metrics**:
  - Total coaches in the system
  - Coaches currently in onboarding
  - Coaches ready to coach (80%+ readiness score)

- **Readiness Score Calculation** (100 points total):
  - Profile completeness: 20 points
  - Onboarding started: 15 points
  - Onboarding completed: 25 points
  - Has recommendations: 10 points
  - Has attachments: 10 points
  - Experience level: 20 points

- **Coach Table View**:
  - Name and email
  - Current status (Provisioned, Onboarding, Active)
  - Visual readiness progress bar
  - Experience and background
  - Top strengths
  - Quick management access

### 2. Personalized Recommendations
Admins can now:
- Add custom recommendations for each coach
- Track recommendation history
- Remove outdated recommendations
- Recommendations are stored with timestamps

### 3. Resource Management
Admins can attach resources to coaches:
- Documents (PDFs, Google Docs)
- Videos (YouTube, Google Drive)
- Templates
- Guides
- Each resource has title, URL, and type

## Integration Architecture

### Option 1: Embedded Module (Recommended)
```javascript
// In your main platform
import CoachTrainingModule from './coach-training/src/App';

function MainPlatform() {
  return (
    <div>
      <MainNavigation />
      <Routes>
        <Route path="/coach-training/*" element={<CoachTrainingModule />} />
        {/* Other routes */}
      </Routes>
    </div>
  );
}
```

### Option 2: Shared Authentication
```javascript
// Share Firebase auth across platforms
export const sharedAuth = {
  auth,
  db,
  checkUserRole: async (uid) => {
    const doc = await getDoc(doc(db, 'users', uid));
    return doc.data()?.role;
  }
};
```

### Option 3: API Integration
```javascript
// Create API endpoints
app.get('/api/coaches/:id/readiness', async (req, res) => {
  const coach = await getCoachData(req.params.id);
  const readiness = calculateReadiness(coach);
  res.json({ readiness, coach });
});

app.post('/api/coaches/:id/recommendations', async (req, res) => {
  const { recommendation } = req.body;
  await addRecommendation(req.params.id, recommendation);
  res.json({ success: true });
});
```

## Database Schema

### Collections Structure
```
firestore/
├── users/
│   └── {uid}/
│       ├── email
│       ├── name
│       ├── role: "admin" | "coach"
│       └── status: "provisioned" | "onboarding" | "active"
│
├── coaches/
│   └── {uid}/
│       ├── name
│       ├── email
│       ├── background
│       ├── experience
│       ├── strengths: []
│       ├── gaps: []
│       ├── readinessScore: number
│       ├── adminRecommendations: [
│       │   {
│       │     text: string,
│       │     createdAt: timestamp,
│       │     createdBy: string
│       │   }
│       │ ]
│       └── attachments: [
│           {
│             title: string,
│             url: string,
│             type: "document" | "video" | "template" | "guide",
│             createdAt: timestamp
│           }
│         ]
│
└── indexed_videos/
    └── {docId}/
        ├── title
        ├── driveId
        └── category
```

## Deployment Options

### 1. Subdomain Deployment
```
main-platform.ivylevel.com
coach-training.ivylevel.com  <- This platform
```

### 2. Path-based Deployment
```
ivylevel.com/
ivylevel.com/coach-training/  <- This platform
```

### 3. Unified Deployment
Merge both codebases and deploy as single application.

## Security Considerations

1. **Role-based Access**:
   - Only admins can access the dashboard
   - Coaches can only see their own data
   - Public users have no access

2. **Firebase Security Rules**:
```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin can read/write everything
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Coaches can read their own data
    match /coaches/{coachId} {
      allow read: if request.auth != null && request.auth.uid == coachId;
    }
  }
}
```

## API Endpoints for Main Platform

If you want to access coach data from your main platform:

### Get Coach Readiness
```
GET /api/coach/{coachId}/readiness
Response: {
  readinessScore: 85,
  status: "active",
  completedModules: ["onboarding", "fundamentals"],
  recommendations: []
}
```

### Get All Coaches (Admin only)
```
GET /api/coaches
Response: [{
  id: "uid",
  name: "Coach Name",
  readinessScore: 85,
  status: "active"
}]
```

### Add Recommendation
```
POST /api/coach/{coachId}/recommendation
Body: {
  text: "Focus on improving SAT strategies"
}
```

## Next Steps

1. **Choose Integration Method**:
   - Embedded module (easiest)
   - Shared auth (medium complexity)
   - API integration (most flexible)

2. **Update Main Platform Navigation**:
   - Add "Coach Training" menu item
   - Link to this platform

3. **Configure Single Sign-On**:
   - Share Firebase auth instance
   - Or implement OAuth flow

4. **Set Up Monitoring**:
   - Track coach progress
   - Monitor completion rates
   - Alert on low readiness scores

5. **Add Email Notifications**:
   - New coach provisioned
   - Coach completed onboarding
   - Admin added recommendation