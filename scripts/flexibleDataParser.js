// flexibleDataParser.js - Flexible parsing that handles missing data
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

// Known coaches and students based on analysis
const KNOWN_COACHES = ['Jenny', 'Rishi', 'Noor', 'Juli', 'Aditi', 'Marissa', 'Jamie', 'Erin', 'Steven', 'Kelvin'];
const KNOWN_STUDENTS = ['Arshiya', 'Anoushka', 'Aarav', 'Aarnav', 'Aaryan', 'Advay', 'Ananyaa', 'Andrew', 
                        'Beya', 'Iqra', 'Kavya', 'Zainab', 'Abhi', 'Huda', 'Sameeha', 'Anila', 'Mia', 'Hiba'];
const DATA_SOURCES = ['A', 'B', 'C'];

// Flexible parsing function
function parseFlexibly(data) {
  const result = {
    source: null,
    coach: null,
    student: null,
    week: null,
    date: null,
    category: data.category,
    isGamePlan: false,
    confidence: 'low' // Track parsing confidence
  };
  
  // 1. Try folder path first (most reliable)
  if (data.folderPath) {
    // Pattern: /Students/StudentName/
    const studentMatch = data.folderPath.match(/\/Students\/([^\/]+)/);
    if (studentMatch) {
      result.student = studentMatch[1];
      result.confidence = 'high';
    }
    
    // Pattern: /Coaches/CoachName/
    const coachMatch = data.folderPath.match(/\/Coaches\/([^\/]+)/);
    if (coachMatch) {
      result.coach = coachMatch[1];
      result.confidence = 'high';
    }
    
    // Check for Game Plan in path
    if (data.folderPath.toLowerCase().includes('game plan') || 
        data.folderPath.toLowerCase().includes('gameplan')) {
      result.isGamePlan = true;
    }
  }
  
  // 2. Parse from filename with flexibility
  if (data.filename) {
    // Split by underscore but handle variations
    const parts = data.filename.split(/[_\-\s]+/);
    
    // Look for known patterns flexibly
    parts.forEach((part, index) => {
      // Check for data source
      if (DATA_SOURCES.includes(part)) {
        result.source = part;
      }
      
      // Check for known coaches
      if (KNOWN_COACHES.includes(part) && !result.coach) {
        result.coach = part;
        if (!result.confidence) result.confidence = 'medium';
      }
      
      // Check for known students
      if (KNOWN_STUDENTS.includes(part) && !result.student) {
        result.student = part;
        if (!result.confidence) result.confidence = 'medium';
      }
      
      // Check for week patterns
      if (part.match(/^Wk\d+$/i) || part.match(/^Week\d+$/i)) {
        result.week = part.replace(/^(Wk|Week)/i, '');
      }
      
      // Check for date patterns (YYYY-MM-DD)
      if (part.match(/^\d{4}-\d{2}-\d{2}$/)) {
        result.date = part;
      }
    });
    
    // Check for Game Plan
    if (data.filename.toLowerCase().includes('gameplan') || 
        data.filename.toLowerCase().includes('game_plan')) {
      result.isGamePlan = true;
    }
  }
  
  // 3. Parse from title with flexibility
  if (data.title && (!result.coach || !result.student)) {
    // Remove source indicators from title
    let cleanTitle = data.title;
    DATA_SOURCES.forEach(source => {
      cleanTitle = cleanTitle.replace(new RegExp(`\\b${source}\\s*&`, 'g'), '');
      cleanTitle = cleanTitle.replace(new RegExp(`&\\s*${source}\\b`, 'g'), '');
    });
    
    // Pattern: "Name1 & Name2"
    const nameMatch = cleanTitle.match(/^(\w+)\s*&\s*(\w+)/);
    if (nameMatch) {
      const [_, first, second] = nameMatch;
      
      // Determine coach vs student
      if (KNOWN_COACHES.includes(first)) {
        result.coach = result.coach || first;
        result.student = result.student || second;
      } else if (KNOWN_STUDENTS.includes(second)) {
        result.student = result.student || second;
        result.coach = result.coach || first;
      } else if (KNOWN_STUDENTS.includes(first)) {
        result.student = result.student || first;
        result.coach = result.coach || second;
      } else {
        // Guess based on common pattern (coach usually first)
        result.coach = result.coach || first;
        result.student = result.student || second;
        result.confidence = 'low';
      }
    }
    
    // Extract week from title
    const weekMatch = data.title.match(/Week\s*(\d+)/i);
    if (weekMatch && !result.week) {
      result.week = weekMatch[1];
    }
    
    // Extract date from title
    const dateMatch = data.title.match(/\((\d{4}-\d{2}-\d{2})\)/);
    if (dateMatch && !result.date) {
      result.date = dateMatch[1];
    }
  }
  
  // 4. Check for Game Plan in various fields
  const allText = `${data.title || ''} ${data.filename || ''} ${data.category || ''} ${(data.tags || []).join(' ')}`.toLowerCase();
  if (allText.includes('gameplan') || allText.includes('game plan') || allText.includes('game_plan')) {
    result.isGamePlan = true;
  }
  
  // 5. Generate proper title if we have enough info
  if (result.isGamePlan && result.student) {
    result.properTitle = `Game Plan - ${result.student}${result.week ? ` - Week ${result.week}` : ''}`;
  } else if (result.coach && result.student) {
    result.properTitle = `${result.coach} & ${result.student}${result.week ? ` - Week ${result.week}` : ''}${result.date ? ` (${result.date})` : ''}`;
  }
  
  return result;
}

// Main function
async function fixWithFlexibleParsing() {
  console.log('🔧 Fixing data with flexible parsing...\n');
  
  const db = initializeAdmin();
  
  try {
    const snapshot = await db.collection('indexed_videos').get();
    console.log(`📊 Found ${snapshot.size} documents to process\n`);
    
    let stats = {
      total: snapshot.size,
      fixed: 0,
      gamePlansFound: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      sourcesFixed: 0
    };
    
    const batches = [];
    let currentBatch = db.batch();
    let batchCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const parsed = parseFlexibly(data);
      
      const updates = {};
      let needsUpdate = false;
      
      // Track confidence
      if (parsed.confidence === 'high') stats.highConfidence++;
      else if (parsed.confidence === 'medium') stats.mediumConfidence++;
      else stats.lowConfidence++;
      
      // Fix source (A/B/C are NOT names!)
      if (parsed.source) {
        updates.dataSource = parsed.source;
        
        // Remove source letters from name fields
        if (DATA_SOURCES.includes(data.parsedStudent)) {
          updates.parsedStudent = parsed.student || null;
          needsUpdate = true;
          stats.sourcesFixed++;
          console.log(`🔧 Fixing source: "${data.title}" - ${data.parsedStudent} → ${parsed.student || 'Unknown'}`);
        }
        
        if (DATA_SOURCES.includes(data.parsedCoach)) {
          updates.parsedCoach = parsed.coach || null;
          needsUpdate = true;
        }
      }
      
      // Update coach if found and different
      if (parsed.coach && parsed.coach !== data.parsedCoach) {
        updates.parsedCoach = parsed.coach;
        needsUpdate = true;
      }
      
      // Update student if found and different
      if (parsed.student && parsed.student !== data.parsedStudent) {
        updates.parsedStudent = parsed.student;
        needsUpdate = true;
      }
      
      // Add proper title if generated
      if (parsed.properTitle && parsed.properTitle !== data.properTitle) {
        updates.properTitle = parsed.properTitle;
        updates.originalTitle = data.title;
        needsUpdate = true;
      }
      
      // Fix Game Plans
      if (parsed.isGamePlan) {
        stats.gamePlansFound++;
        if (data.category !== 'game_plan_reports') {
          updates.category = 'game_plan_reports';
          updates.sessionType = 'game_plan_session';
          needsUpdate = true;
        }
      }
      
      // Add parsed week if found
      if (parsed.week && !data.parsedWeek) {
        updates.parsedWeek = parsed.week;
        needsUpdate = true;
      }
      
      // Add parsing metadata
      if (needsUpdate) {
        updates.parsingConfidence = parsed.confidence;
        updates.fixedAt = admin.firestore.FieldValue.serverTimestamp();
        updates.dataVersion = '4.0';
        
        currentBatch.update(doc.ref, updates);
        stats.fixed++;
        batchCount++;
        
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
    
    // Display results
    console.log('\n✅ Flexible parsing complete!');
    console.log('\n📊 Summary:');
    console.log(`   Total documents: ${stats.total}`);
    console.log(`   Documents fixed: ${stats.fixed}`);
    console.log(`   Source letters fixed: ${stats.sourcesFixed}`);
    console.log(`   Game Plans found: ${stats.gamePlansFound}`);
    console.log('\n📊 Parsing Confidence:');
    console.log(`   High confidence: ${stats.highConfidence} (from folder paths)`);
    console.log(`   Medium confidence: ${stats.mediumConfidence} (from known names)`);
    console.log(`   Low confidence: ${stats.lowConfidence} (best guess)`);
    
    // Check specific students
    console.log('\n🔍 Checking key students...');
    for (const student of ['Arshiya', 'Abhi', 'Anoushka']) {
      const sessions = await db.collection('indexed_videos')
        .where('parsedStudent', '==', student)
        .get();
      
      let gamePlanFound = false;
      sessions.forEach(doc => {
        if (doc.data().category === 'game_plan_reports') {
          gamePlanFound = true;
        }
      });
      
      console.log(`   ${student}: ${sessions.size} sessions${gamePlanFound ? ' (✅ Has Game Plan)' : ' (❌ No Game Plan)'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  fixWithFlexibleParsing()
    .then(() => {
      console.log('\n✅ Process complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { parseFlexibly, fixWithFlexibleParsing };