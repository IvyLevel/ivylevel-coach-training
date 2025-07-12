# Testing Guide: Day 0 & Day 1 Coach Onboarding

## Prerequisites
- Firebase project is already configured ✓
- You have admin access to Firebase Console
- The app is running locally with `npm start`

## Day 0: Admin Provisioning Flow

### 1. Create/Use Admin Account
- In Firebase Console > Authentication
- Create a user with email: `admin@ivylevel.com` (or any email with "admin" in it)
- Set a password

### 2. Login as Admin
- Open the app
- Login with admin credentials
- You should see the "Add New Coach" button in the dashboard

### 3. Provision a New Coach
- Click "Add New Coach"
- Fill out the form:
  - **Name**: Sarah Johnson (or real coach name)
  - **Email**: sarah.johnson@ivylevel.com
  - **Background**: High School Counselor
  - **Experience**: 3 years
  - **Strengths**: Check relevant boxes
  - **Development Areas**: Check areas needing improvement
  - **Documents**: Add resume/LinkedIn URLs if available
  - **Interview Notes**: Paste any interview transcript
  
- Click "Analyze with AI"
- Review the AI recommendations
- Click "Approve & Provision"

### 4. Create Coach User in Firebase Auth
- Go to Firebase Console > Authentication
- Add the coach user with the same email used in provisioning
- Set a temporary password

## Day 1: Coach Welcome Experience

### 1. Login as New Coach
- Logout from admin account
- Login with the new coach credentials
- The system should automatically detect the coach needs onboarding

### 2. Welcome Flow
The coach will see:
1. **Personalized Welcome** - with their name
2. **Their Strengths** - pulled from admin provisioning
3. **Custom Learning Path** - based on gaps identified
4. **Today's Videos** - first 2 recommended videos

### 3. Complete Onboarding
- Click through all 4 steps
- Click "Begin My Journey"
- Coach is now in the main dashboard

## Verification in Firestore

Check Firebase Console > Firestore to verify:

1. **users collection**:
   - Admin user document exists with `role: "admin"`
   - Coach user document exists with `role: "coach"`

2. **coaches collection**:
   - New coach profile with all provisioning data
   - Contains `aiAnalysis` with recommendations
   - `status: "provisioned"` before onboarding
   - `onboardingStarted` timestamp after welcome

## Troubleshooting

### Coach doesn't see welcome screen:
- Check Firestore: coach document must have `status: "provisioned"`
- Ensure `onboardingStarted` field doesn't exist yet
- Verify the coach's user document has `role: "coach"`

### Admin doesn't see provisioning button:
- Check user document has `role: "admin"`
- Email should contain "admin" for auto-detection

### Login issues:
- Check Firebase Console for any auth errors
- Ensure `.env` file has correct Firebase credentials
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Sample Test Data

### Coach 1: Technical Background
- Name: Michael Chen
- Background: Test Prep Instructor
- Strengths: SAT/ACT Prep, Data Analysis
- Gaps: Essay Coaching, College Process

### Coach 2: Counseling Background  
- Name: Maria Rodriguez
- Background: High School Counselor
- Strengths: Student Rapport, Organization
- Gaps: SAT Strategies, Elite Admissions

### Coach 3: College Admissions Background
- Name: James Wilson
- Background: Former Admissions Officer
- Strengths: Application Review, Essay Excellence
- Gaps: Test Prep, Student Motivation

---

## Next Steps

After successful testing:
1. Document any issues or improvements needed
2. Test with real coach interview data
3. Refine AI analysis prompts based on results
4. Consider adding email notifications for new coaches