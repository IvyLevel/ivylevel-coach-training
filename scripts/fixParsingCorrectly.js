// fixParsingCorrectly.js - Fix parsing with correct understanding of data structure
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Admin SDK
function initializeAdmin() {
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account key not found');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });

  console.log('✅ Admin SDK initialized');
  return admin.firestore();
}

// Extract info from folder path and filename
function parseCorrectly(data) {
  const result = {
    source: null,
    coach: null,
    student: null,
    week: null,
    date: null,
    category: data.category,
    isGamePlan: false
  };
  
  // 1. Parse from folder path (most reliable)
  if (data.folderPath) {
    // Pattern: /Students/StudentName/
    const studentMatch = data.folderPath.match(/\/Students\/([^\/]+)\//);
    if (studentMatch) {
      result.student = studentMatch[1];
    }
    
    // Pattern: /Coaches/CoachName/
    const coachMatch = data.folderPath.match(/\/Coaches\/([^\/]+)\//);
    if (coachMatch) {
      result.coach = coachMatch[1];
    }
  }
  
  // 2. Parse from filename pattern: Category_Source_Coach_Student_WkXX_Date_M_ID_U_UUID
  if (data.filename) {
    const parts = data.filename.split('_');
    
    if (parts.length >= 6) {
      // parts[0] = Category (Coaching, TRIVIAL, etc)
      // parts[1] = Source (A/B/C)
      // parts[2] = Coach
      // parts[3] = Student
      // parts[4] = WkXX
      // parts[5] = Date
      
      if (parts[1] && ['A', 'B', 'C'].includes(parts[1])) {
        result.source = parts[1];
      }
      
      if (parts[2] && !result.coach) {
        result.coach = parts[2];
      }
      
      if (parts[3] && !result.student) {
        result.student = parts[3];
      }
      
      if (parts[4] && parts[4].startsWith('Wk')) {
        result.week = parts[4].substring(2);
      }
      
      if (parts[5]) {
        result.date = parts[5];
      }
    }
  }
  
  // 3. Fix the title which is currently wrong (e.g., "B & Jenny" should be "Jenny & Student")
  if (data.title && result.coach && result.student) {
    // For Game Plans
    if (data.title.toLowerCase().includes('gameplan')) {
      result.isGamePlan = true;
      result.properTitle = `Game Plan - ${result.student} - Week ${result.week || '1'}`;
    } else {
      // Regular coaching sessions
      result.properTitle = `${result.coach} & ${result.student} - Week ${result.week || 'XX'} (${result.date || ''})`;
    }
  }
  
  return result;
}

// Main fix function
async function fixAllParsing() {
  console.log('🔧 Fixing all parsing with correct understanding...\n');
  
  const db = initializeAdmin();
  
  try {
    const snapshot = await db.collection('indexed_videos').get();
    console.log(`📊 Found ${snapshot.size} documents to fix\n`);
    
    let fixedCount = 0;
    let gamePlansFixed = 0;
    const batches = [];
    let currentBatch = db.batch();
    let batchCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const parsed = parseCorrectly(data);
      
      const updates = {};
      let needsUpdate = false;
      
      // Fix source field (A/B/C are NOT names!)
      if (parsed.source) {
        updates.dataSource = parsed.source;
        
        // Remove B from student field if it's there
        if (data.parsedStudent === 'B' || data.parsedStudent === 'A' || data.parsedStudent === 'C') {
          updates.parsedStudent = parsed.student || null;
          needsUpdate = true;
          console.log(`🔧 Fixing "${data.title}" - ${data.parsedStudent} is source, not student`);
        }
        
        // Remove source letters from coach field
        if (data.parsedCoach === 'B' || data.parsedCoach === 'A' || data.parsedCoach === 'C') {
          updates.parsedCoach = parsed.coach || null;
          needsUpdate = true;
        }
      }
      
      // Update coach
      if (parsed.coach && parsed.coach !== data.parsedCoach) {
        updates.parsedCoach = parsed.coach;
        needsUpdate = true;
      }
      
      // Update student
      if (parsed.student && parsed.student !== data.parsedStudent) {
        updates.parsedStudent = parsed.student;
        needsUpdate = true;
      }
      
      // Fix title if we have proper names
      if (parsed.properTitle && parsed.properTitle !== data.title) {
        updates.properTitle = parsed.properTitle;
        // Keep original title for reference
        updates.originalTitle = data.title;
        needsUpdate = true;
      }
      
      // Fix Game Plans
      if (parsed.isGamePlan) {
        if (data.category !== 'game_plan_reports') {
          updates.category = 'game_plan_reports';
          updates.sessionType = 'game_plan_session';
          needsUpdate = true;
          gamePlansFixed++;
        }
      }
      
      // Add parsed week
      if (parsed.week && !data.parsedWeek) {
        updates.parsedWeek = parsed.week;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updates.fixedAt = admin.firestore.FieldValue.serverTimestamp();
        updates.dataVersion = '3.0';
        updates.parsingFixed = true;
        
        currentBatch.update(doc.ref, updates);
        fixedCount++;
        batchCount++;
        
        // Commit every 400 documents
        if (batchCount >= 400) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          batchCount = 0;
        }
      }
    });
    
    // Add final batch
    if (batchCount > 0) {
      batches.push(currentBatch);
    }
    
    // Commit all batches
    console.log(`\n💾 Committing ${batches.length} batches...`);
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`   Batch ${i + 1}/${batches.length} committed`);
    }
    
    console.log('\n✅ Parsing fixed!');
    console.log(`📊 Summary:`);
    console.log(`   Documents fixed: ${fixedCount}`);
    console.log(`   Game Plans fixed: ${gamePlansFixed}`);
    
    // Show sample results
    console.log('\n📋 Checking fixed Game Plans...');
    const gamePlans = await db.collection('indexed_videos')
      .where('category', '==', 'game_plan_reports')
      .where('parsedStudent', '!=', null)
      .limit(10)
      .get();
    
    console.log(`\nFound ${gamePlans.size} Game Plans with students:`);
    gamePlans.forEach(doc => {
      const data = doc.data();
      console.log(`- Student: ${data.parsedStudent} | Coach: ${data.parsedCoach || 'N/A'} | Title: ${data.properTitle || data.title}`);
    });
    
    // Check Arshiya's data specifically
    console.log('\n🔍 Checking Arshiya\'s sessions...');
    const arshiyaSessions = await db.collection('indexed_videos')
      .where('parsedStudent', '==', 'Arshiya')
      .get();
    
    console.log(`Found ${arshiyaSessions.size} Arshiya sessions`);
    let arshiyaGamePlan = null;
    arshiyaSessions.forEach(doc => {
      const data = doc.data();
      if (data.category === 'game_plan_reports') {
        arshiyaGamePlan = data;
      }
    });
    
    if (arshiyaGamePlan) {
      console.log('✅ Arshiya has a Game Plan!');
    } else {
      console.log('❌ No Game Plan found for Arshiya - may need to be created');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
if (require.main === module) {
  fixAllParsing()
    .then(() => {
      console.log('\n✅ Process complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fixAllParsing };