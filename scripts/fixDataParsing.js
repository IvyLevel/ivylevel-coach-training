// fixDataParsing.js - Fix the fundamental parsing error in our data
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

// Extract REAL coach and student names from Knowledge Base structure
const KNOWN_COACHES = ['Kelvin', 'Noor', 'Jamie', 'Jenny']; // From Root/Coaches/
const KNOWN_STUDENTS = ['Abhi', 'Arshiya', 'Andrew', 'Erin', 'Marissa']; // From Root/Students/

// Data source indicators (NOT names!)
const DATA_SOURCES = {
  'A': 'zoom_cloud',
  'B': 'gdrive_archive', 
  'C': 'webhook_future'
};

// Parse filename to extract REAL names
function parseFileNameCorrectly(filename, title, folderPath) {
  console.log(`\nParsing: ${filename || title}`);
  
  const result = {
    source: null,
    coach: null,
    student: null,
    week: null,
    date: null,
    isGamePlan: false
  };
  
  // Check if it's a Game Plan
  if (filename && filename.toLowerCase().includes('gameplan')) {
    result.isGamePlan = true;
  }
  
  // Extract from folder path if available
  if (folderPath) {
    // Look for /Coaches/CoachName/ pattern
    const coachMatch = folderPath.match(/\/Coaches\/([^\/]+)/i);
    if (coachMatch) {
      result.coach = coachMatch[1];
    }
    
    // Look for /Students/StudentName/ pattern
    const studentMatch = folderPath.match(/\/Students\/([^\/]+)/i);
    if (studentMatch) {
      result.student = studentMatch[1];
    }
  }
  
  // Parse from filename/title patterns
  const text = filename || title || '';
  
  // Pattern: "Source & Student - Week XX" or "Coach & Student - Week XX"
  const patterns = [
    // "Gameplan & B - Week 1" -> B is source, need to find student elsewhere
    /^(\w+)\s*&\s*([A-C])\s*-\s*Week\s*(\d+)/i,
    // "Jenny & Arshiya - Week 13"
    /^(\w+)\s*&\s*(\w+)\s*-\s*Week\s*(\d+)/i,
    // "B & Andrew - Week 10" -> B is source, Andrew is student
    /^([A-C])\s*&\s*(\w+)\s*-\s*Week\s*(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const [_, first, second, week] = match;
      
      // Determine what first and second are
      if (DATA_SOURCES[first]) {
        // First is a source indicator
        result.source = DATA_SOURCES[first];
        // Second might be a student
        if (KNOWN_STUDENTS.includes(second)) {
          result.student = second;
        }
      } else if (DATA_SOURCES[second]) {
        // Second is a source indicator
        result.source = DATA_SOURCES[second];
        // First might be a coach for Game Plans
        if (result.isGamePlan && KNOWN_COACHES.includes(first)) {
          result.coach = first;
        }
      } else {
        // Neither is a source, so it's Coach & Student
        if (KNOWN_COACHES.includes(first)) {
          result.coach = first;
          result.student = second;
        } else if (KNOWN_STUDENTS.includes(first)) {
          result.student = first;
          result.coach = second;
        }
      }
      
      result.week = week;
      break;
    }
  }
  
  // Extract date if present
  const dateMatch = text.match(/\((\d{4}-\d{2}-\d{2})\)/);
  if (dateMatch) {
    result.date = dateMatch[1];
  }
  
  console.log('Parsed result:', result);
  return result;
}

// Main function to fix the data
async function fixDataParsing() {
  console.log('🔧 Fixing data parsing errors...\n');
  
  const db = initializeAdmin();
  
  try {
    // Fetch all documents
    const snapshot = await db.collection('indexed_videos').get();
    console.log(`📊 Found ${snapshot.size} documents to fix\n`);
    
    let fixed = 0;
    let gamePlansFixed = 0;
    const batch = db.batch();
    let batchCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const parsed = parseFileNameCorrectly(data.filename, data.title, data.folderPath);
      
      // Prepare updates
      const updates = {};
      let needsUpdate = false;
      
      // Fix source (remove if it was mistaken for a name)
      if (parsed.source && data.parsedStudent === 'B') {
        updates.dataSource = parsed.source;
        updates.parsedStudent = parsed.student || null;
        needsUpdate = true;
        console.log(`🔧 Fixing: "${data.title}" - B is source, not student`);
      }
      
      // Update coach if found
      if (parsed.coach && parsed.coach !== data.parsedCoach) {
        updates.parsedCoach = parsed.coach;
        needsUpdate = true;
      }
      
      // Update student if found
      if (parsed.student && parsed.student !== data.parsedStudent) {
        updates.parsedStudent = parsed.student;
        needsUpdate = true;
      }
      
      // Fix Game Plan categorization
      if (parsed.isGamePlan) {
        if (data.category !== 'game_plan_reports') {
          updates.category = 'game_plan_reports';
          updates.sessionType = 'game_plan_session';
          needsUpdate = true;
          gamePlansFixed++;
        }
      }
      
      // Add metadata
      if (needsUpdate) {
        updates.fixedAt = admin.firestore.FieldValue.serverTimestamp();
        updates.dataVersion = '3.0';
        
        const docRef = db.collection('indexed_videos').doc(doc.id);
        batch.update(docRef, updates);
        fixed++;
        batchCount++;
        
        // Commit batch every 400 documents
        if (batchCount >= 400) {
          await batch.commit();
          console.log(`💾 Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      }
    });
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`💾 Committed final batch of ${batchCount} updates`);
    }
    
    console.log('\n✅ Data parsing fixed!');
    console.log(`📊 Summary:`);
    console.log(`   Documents fixed: ${fixed}`);
    console.log(`   Game Plans corrected: ${gamePlansFixed}`);
    
    // Show sample of fixed Game Plans
    console.log('\n📋 Checking Game Plans after fix...');
    const gamePlansQuery = await db.collection('indexed_videos')
      .where('category', '==', 'game_plan_reports')
      .limit(10)
      .get();
    
    console.log(`Found ${gamePlansQuery.size} Game Plans:`);
    gamePlansQuery.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.title} | Coach: ${data.parsedCoach || 'N/A'} | Student: ${data.parsedStudent || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
if (require.main === module) {
  fixDataParsing()
    .then(() => {
      console.log('\n✅ Process complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fixDataParsing, parseFileNameCorrectly };