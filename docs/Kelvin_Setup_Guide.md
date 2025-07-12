# Setting Up Kelvin's Coach Account

## Step 1: Verify Provisioning ✓
You've successfully provisioned Kelvin through the admin interface. His data should now be in Firestore.

## Step 2: Create Kelvin's Firebase Auth Account
1. Go to Firebase Console > Authentication
2. Click "Add user"
3. Enter:
   - Email: [The email you used when provisioning Kelvin]
   - Password: Testing123!
   
## Step 3: Test Kelvin's Welcome Experience
1. **Logout** from the admin account (click Logout button)
2. **Login** with Kelvin's credentials
3. The system should automatically detect:
   - Kelvin is a coach
   - His status is "provisioned"
   - He hasn't started onboarding yet
4. He should be redirected to the **Coach Welcome** experience

## What Kelvin Will See:

### Step 1: Personalized Welcome
- "Welcome, Kelvin!"
- Message about his personalized training path

### Step 2: His Unique Strengths
- The strengths you selected during provisioning
- Each strength highlighted with green checkmarks

### Step 3: Personalized Learning Path
- Week 1: Focus on his development areas
- Week 2: Practice & Certification
- His assigned mentor (based on AI analysis)

### Step 4: Today's Focus
- Two recommended videos to start with
- Tailored to address his specific gaps

## Troubleshooting

### If Kelvin sees the regular dashboard instead of welcome:
1. Check Firestore Console > `coaches` collection
2. Find Kelvin's document
3. Verify it has:
   ```
   status: "provisioned"
   ```
4. Make sure `onboardingStarted` field does NOT exist

### If login fails:
- Double-check the email matches exactly
- Ensure you created his Firebase Auth account
- Try password reset if needed

## After Welcome Completion
Once Kelvin clicks "Begin My Journey":
- His status updates to "onboarding"
- `onboardingStarted` timestamp is added
- He's redirected to the main coach dashboard
- Future logins go straight to dashboard

## Quick Test Checklist
- [ ] Kelvin's coach profile exists in Firestore
- [ ] Firebase Auth account created with same email
- [ ] Can login successfully
- [ ] Sees 4-step welcome experience
- [ ] Welcome shows his actual strengths/gaps
- [ ] Can complete onboarding flow