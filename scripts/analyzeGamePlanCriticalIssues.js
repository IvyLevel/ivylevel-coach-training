// analyzeGamePlanCriticalIssues.js - Comprehensive analysis of Game Plan session issues
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Known correct information
const GAME_PLAN_COACH = 'Jenny'; // Head coach who leads all game plans

async function analyzeGamePlanIssues() {
  console.log('=== ANALYZING GAME PLAN SESSION ISSUES ===\n');
  console.log('Expected: Coach = Jenny (head coach leads all game plans)');
  console.log('Reported issues:');
  console.log('  1. Duration shows as 5m but actual video is 1hr 29min');
  console.log('  2. Coach shows as "Juli" but should be "Jenny"');
  console.log('  3. Filename shows: Coaching_GamePlan_B_Jenny_Ananyaa_Wk1_2024-09-06_M_fe05e4db11c4b53bU_fe05e4db11c4b53b\n');

  try {
    // First, let's find all game plan sessions
    const gamePlanQueries = [
      db.collection('indexed_videos').where('category', '==', 'game_plan_reports'),
      db.collection('indexed_videos').where('sessionType', '==', 'game_plan_session')
    ];

    let allGamePlans = [];
    
    for (const query of gamePlanQueries) {
      const snapshot = await query.get();
      snapshot.forEach(doc => {
        allGamePlans.push({ id: doc.id, ...doc.data() });
      });
    }

    // Also check by title
    const allVideos = await db.collection('indexed_videos').get();
    allVideos.forEach(doc => {
      const data = doc.data();
      if (data.title && (data.title.toLowerCase().includes('gameplan') || 
                         data.title.toLowerCase().includes('game plan'))) {
        // Check if already in list
        if (!allGamePlans.find(gp => gp.id === doc.id)) {
          allGamePlans.push({ id: doc.id, ...data });
        }
      }
    });

    console.log(`\nFound ${allGamePlans.length} total Game Plan sessions\n`);

    // Analyze each game plan
    const issues = {
      wrongCoach: [],
      shortDuration: [],
      missingDuration: [],
      filenameMismatch: []
    };

    allGamePlans.forEach((gamePlan, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`GAME PLAN ${index + 1}/${allGamePlans.length}`);
      console.log(`${'='.repeat(80)}`);
      
      console.log(`\nDocument ID: ${gamePlan.id}`);
      console.log(`Title: ${gamePlan.title || 'N/A'}`);
      console.log(`Original Filename: ${gamePlan.filename || 'N/A'}`);
      
      console.log('\n--- PARSED DATA vs FILENAME ---');
      console.log(`Parsed Coach: "${gamePlan.parsedCoach || 'N/A'}" ${gamePlan.parsedCoach !== GAME_PLAN_COACH ? '❌ INCORRECT' : '✅'}`);
      console.log(`Parsed Student: "${gamePlan.parsedStudent || 'N/A'}"`);
      console.log(`Duration: "${gamePlan.duration || 'N/A'}"`);
      
      // Check if coach is wrong
      if (gamePlan.parsedCoach && gamePlan.parsedCoach !== GAME_PLAN_COACH) {
        issues.wrongCoach.push(gamePlan);
      }
      
      // Check duration issues
      if (!gamePlan.duration) {
        issues.missingDuration.push(gamePlan);
      } else if (gamePlan.duration === '5:00' || gamePlan.duration === '5') {
        issues.shortDuration.push(gamePlan);
        console.log(`Duration Issue: Shows as "${gamePlan.duration}" which likely means 5 minutes, but game plans are typically 1-2 hours`);
      }
      
      // Parse filename to extract actual data
      if (gamePlan.filename) {
        console.log('\n--- FILENAME ANALYSIS ---');
        console.log(`Filename: ${gamePlan.filename}`);
        
        const parts = gamePlan.filename.split('_');
        console.log(`Parts: [${parts.join(', ')}]`);
        
        // Look for Jenny in filename
        const jennyInFilename = parts.includes('Jenny');
        console.log(`Jenny in filename: ${jennyInFilename ? 'YES ✅' : 'NO ❌'}`);
        
        // Extract pattern: Coaching_GamePlan_[Source]_[Coach]_[Student]_[Week]_[Date]_...
        if (parts[0] === 'Coaching' && (parts[1] === 'GamePlan' || parts[1] === 'Game')) {
          const filenameCoach = parts[3];
          const filenameStudent = parts[4];
          const filenameWeek = parts[5];
          const filenameDate = parts[6];
          
          console.log(`\nExtracted from filename:`);
          console.log(`  Coach: ${filenameCoach}`);
          console.log(`  Student: ${filenameStudent}`);
          console.log(`  Week: ${filenameWeek}`);
          console.log(`  Date: ${filenameDate}`);
          
          if (filenameCoach !== gamePlan.parsedCoach) {
            console.log(`\n⚠️  FILENAME MISMATCH: Coach in filename (${filenameCoach}) != Parsed coach (${gamePlan.parsedCoach})`);
            issues.filenameMismatch.push(gamePlan);
          }
        }
      }
      
      // Show all relevant fields
      console.log('\n--- ALL RELEVANT FIELDS ---');
      const relevantFields = ['coach', 'student', 'parsedCoach', 'parsedStudent', 'coachName', 
                            'studentName', 'duration', 'category', 'sessionType', 'driveId', 
                            'folderPath', 'dataSource', 'properTitle'];
      
      relevantFields.forEach(field => {
        if (gamePlan.hasOwnProperty(field)) {
          console.log(`  ${field}: "${gamePlan[field]}"`);
        }
      });
    });

    // Summary of issues
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('ISSUE SUMMARY');
    console.log(`${'='.repeat(80)}\n`);
    
    console.log(`1. Wrong Coach (should be Jenny): ${issues.wrongCoach.length} sessions`);
    if (issues.wrongCoach.length > 0) {
      console.log('   Sessions with wrong coach:');
      issues.wrongCoach.forEach(gp => {
        console.log(`   - ${gp.title} (Coach: ${gp.parsedCoach})`);
      });
    }
    
    console.log(`\n2. Short Duration (5:00 or 5): ${issues.shortDuration.length} sessions`);
    if (issues.shortDuration.length > 0) {
      console.log('   Sessions with suspicious duration:');
      issues.shortDuration.forEach(gp => {
        console.log(`   - ${gp.title} (Duration: ${gp.duration})`);
      });
    }
    
    console.log(`\n3. Missing Duration: ${issues.missingDuration.length} sessions`);
    
    console.log(`\n4. Filename Mismatches: ${issues.filenameMismatch.length} sessions`);
    if (issues.filenameMismatch.length > 0) {
      console.log('   Sessions where filename data doesn\'t match parsed data:');
      issues.filenameMismatch.forEach(gp => {
        console.log(`   - ${gp.title}`);
      });
    }

    // Check specific example
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('SPECIFIC EXAMPLE CHECK');
    console.log(`${'='.repeat(80)}\n`);
    console.log('Looking for: Coaching_GamePlan_B_Jenny_Ananyaa_Wk1_2024-09-06...\n');
    
    const exampleSession = allGamePlans.find(gp => 
      gp.filename && gp.filename.includes('Jenny_Ananyaa_Wk1_2024-09-06')
    );
    
    if (exampleSession) {
      console.log('✅ Found the example session!');
      console.log('\nFull details:');
      Object.entries(exampleSession).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          console.log(`  ${key}: "${value}"`);
        }
      });
    } else {
      console.log('❌ Could not find the specific example session');
      
      // Try to find Ananyaa's game plans
      const ananyaaGamePlans = allGamePlans.filter(gp => 
        (gp.parsedStudent === 'Ananyaa') || 
        (gp.filename && gp.filename.includes('Ananyaa')) ||
        (gp.title && gp.title.includes('Ananyaa'))
      );
      
      console.log(`\nFound ${ananyaaGamePlans.length} Game Plans for Ananyaa:`);
      ananyaaGamePlans.forEach(gp => {
        console.log(`  - ${gp.title || gp.filename}`);
        console.log(`    Coach: ${gp.parsedCoach}, Duration: ${gp.duration}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await admin.app().delete();
  }
}

// Run the analysis
analyzeGamePlanIssues();