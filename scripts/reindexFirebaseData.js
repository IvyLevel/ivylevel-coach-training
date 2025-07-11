// reindexFirebaseData.js - Reindex Firebase data to match actual Knowledge Base structure
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, addDoc, deleteDoc, writeBatch } = require('firebase/firestore');
const { getStorage, ref, listAll, getMetadata } = require('firebase/storage');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  // Try .env.production as fallback
  const prodEnvPath = path.join(__dirname, '..', '.env.production');
  if (fs.existsSync(prodEnvPath)) {
    require('dotenv').config({ path: prodEnvPath });
  }
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Knowledge Base folder structure mapping
const KNOWLEDGE_BASE_CATEGORIES = {
  'Coaches': {
    type: 'coach_resources',
    subcategories: ['training_materials', 'guidelines', 'templates']
  },
  'Students': {
    type: 'student_sessions',
    subcategories: ['regular_sessions', 'assessments', 'progress_tracking']
  },
  'Trivial': {
    type: 'miscellaneous',
    subcategories: ['administrative', 'general_info']
  },
  'Miscellaneous': {
    type: 'miscellaneous',
    subcategories: ['other_resources', 'uncategorized']
  },
  'Execution Docs': {
    type: 'execution_documents',
    subcategories: ['game_plans', 'action_items', 'follow_ups', 'longitudinal_tracking']
  },
  'Game Plan Reports': {
    type: 'game_plan_reports',
    subcategories: ['assessments', 'strategic_plans', 'progress_reports']
  }
};

// File naming pattern parser: [Category]_[Source]_[Coach]_[Student]_[Week]_[Date]_M_[MeetingID]U_[UUID]
function parseFileName(filename) {
  console.log('Parsing filename:', filename);
  
  // Handle various filename formats
  const patterns = [
    // Standard format: Category_Source_Coach_Student_Week_Date_M_MeetingID_U_UUID
    /^([^_]+)_([^_]+)_([^_]+)_([^_]+)_([^_]+)_([^_]+)_M_([^_]+)_?U_([^_]+)/,
    // Simplified: Coach_Student_Week_Date
    /^([^_]+)_([^_]+)_([^_]+)_([^_]+)/,
    // With spaces: "Coach Name - Student Name - Week XX"
    /^([^-]+)\s*-\s*([^-]+)\s*-\s*([^-]+)/,
    // Basic format: Coach_Student
    /^([^_]+)_([^_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      if (match.length >= 8) {
        // Full format match
        return {
          category: match[1]?.trim(),
          source: match[2]?.trim(),
          coach: match[3]?.trim(),
          student: match[4]?.trim(),
          week: match[5]?.trim(),
          date: match[6]?.trim(),
          meetingId: match[7]?.trim(),
          uuid: match[8]?.trim()
        };
      } else if (match.length >= 4) {
        // Simplified format
        return {
          category: null,
          source: 'unknown',
          coach: match[1]?.trim(),
          student: match[2]?.trim(),
          week: match[3]?.trim(),
          date: match[4]?.trim(),
          meetingId: null,
          uuid: null
        };
      }
    }
  }
  
  // Fallback parsing
  return {
    category: null,
    source: 'unknown',
    coach: null,
    student: null,
    week: null,
    date: null,
    meetingId: null,
    uuid: null
  };
}

// Determine category from folder path
function determineCategoryFromPath(folderPath) {
  console.log('Determining category from path:', folderPath);
  
  if (!folderPath) return 'miscellaneous';
  
  const pathLower = folderPath.toLowerCase();
  
  // Check for exact matches first
  for (const [category, config] of Object.entries(KNOWLEDGE_BASE_CATEGORIES)) {
    if (pathLower.includes(category.toLowerCase())) {
      return config.type;
    }
  }
  
  // Check for partial matches
  if (pathLower.includes('coach')) return 'coach_resources';
  if (pathLower.includes('student')) return 'student_sessions';
  if (pathLower.includes('execution') || pathLower.includes('game plan')) return 'execution_documents';
  if (pathLower.includes('report')) return 'game_plan_reports';
  
  return 'miscellaneous';
}

// Enhanced data enrichment
function enrichDocumentData(originalData, parsedFilename) {
  console.log('Enriching document data for:', originalData.title || originalData.filename);
  
  const enrichedData = {
    ...originalData,
    
    // Update category based on actual folder structure
    category: determineCategoryFromPath(originalData.folderPath),
    
    // Parsed filename data
    parsedCoach: parsedFilename.coach || originalData.parsedCoach,
    parsedStudent: parsedFilename.student || originalData.parsedStudent,
    parsedWeek: parsedFilename.week,
    parsedDate: parsedFilename.date,
    source: parsedFilename.source || 'unknown',
    meetingId: parsedFilename.meetingId,
    sessionUuid: parsedFilename.uuid,
    
    // Enhanced metadata
    reindexedAt: new Date().toISOString(),
    dataVersion: '2.0',
    knowledgeBaseVersion: 'current',
    
    // Enhanced tagging
    tags: generateEnhancedTags(originalData, parsedFilename),
    
    // Session classification
    sessionType: classifySession(originalData, parsedFilename),
    
    // Student identification enhancement
    studentIdentifiers: generateStudentIdentifiers(originalData, parsedFilename),
    
    // Coach identification enhancement
    coachIdentifiers: generateCoachIdentifiers(originalData, parsedFilename)
  };
  
  return enrichedData;
}

function generateEnhancedTags(originalData, parsedFilename) {
  const tags = new Set(originalData.tags || []);
  
  // Add category-based tags
  if (originalData.folderPath) {
    const pathParts = originalData.folderPath.split('/');
    pathParts.forEach(part => {
      if (part.length > 2) {
        tags.add(part.toLowerCase().replace(/[^a-z0-9]/g, '_'));
      }
    });
  }
  
  // Add parsed data tags
  if (parsedFilename.coach) tags.add(`coach_${parsedFilename.coach.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  if (parsedFilename.student) tags.add(`student_${parsedFilename.student.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  if (parsedFilename.week) tags.add(`week_${parsedFilename.week.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  
  // Add session type tags
  const sessionType = classifySession(originalData, parsedFilename);
  if (sessionType) tags.add(sessionType);
  
  return Array.from(tags);
}

function classifySession(originalData, parsedFilename) {
  const title = (originalData.title || '').toLowerCase();
  const filename = (originalData.filename || '').toLowerCase();
  const category = originalData.category || '';
  
  // Game Plan sessions
  if (title.includes('game plan') || filename.includes('game_plan') || 
      category.includes('game_plan') || category.includes('Game Plan')) {
    return 'game_plan_session';
  }
  
  // Assessment sessions
  if (title.includes('assessment') || filename.includes('assessment') ||
      title.includes('evaluation') || filename.includes('evaluation')) {
    return 'assessment_session';
  }
  
  // Regular coaching sessions
  if (parsedFilename.coach && parsedFilename.student) {
    return 'coaching_session';
  }
  
  // Training materials
  if (category.includes('coach') || title.includes('training')) {
    return 'training_material';
  }
  
  return 'general_session';
}

function generateStudentIdentifiers(originalData, parsedFilename) {
  const identifiers = new Set();
  
  // From parsed filename
  if (parsedFilename.student) {
    identifiers.add(parsedFilename.student.toLowerCase());
  }
  
  // From original data
  if (originalData.parsedStudent) {
    identifiers.add(originalData.parsedStudent.toLowerCase());
  }
  
  // From title
  if (originalData.title) {
    const titleParts = originalData.title.split(/[-_&\s]+/);
    titleParts.forEach(part => {
      if (part.length > 2 && /^[A-Za-z]+$/.test(part)) {
        identifiers.add(part.toLowerCase());
      }
    });
  }
  
  return Array.from(identifiers);
}

function generateCoachIdentifiers(originalData, parsedFilename) {
  const identifiers = new Set();
  
  // From parsed filename
  if (parsedFilename.coach) {
    identifiers.add(parsedFilename.coach.toLowerCase());
  }
  
  // From original data
  if (originalData.parsedCoach) {
    identifiers.add(originalData.parsedCoach.toLowerCase());
  }
  
  return Array.from(identifiers);
}

// Main reindexing function
async function reindexFirebaseData() {
  console.log('🔄 Starting Firebase data reindexing...');
  
  try {
    // 1. Fetch all current indexed_videos documents
    console.log('📥 Fetching current indexed_videos...');
    const videosRef = collection(db, 'indexed_videos');
    const videosSnapshot = await getDocs(videosRef);
    
    const documents = [];
    videosSnapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    console.log(`📊 Found ${documents.length} documents to reindex`);
    
    // 2. Create backup collection
    console.log('💾 Creating backup of current data...');
    const backupRef = collection(db, 'indexed_videos_backup');
    const batch = writeBatch(db);
    
    documents.forEach(document => {
      const backupDocRef = doc(backupRef, document.id);
      batch.set(backupDocRef, {
        ...document.data,
        backedUpAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    console.log('✅ Backup created successfully');
    
    // 3. Process and update each document
    console.log('🔄 Processing documents...');
    const updateBatch = writeBatch(db);
    let processedCount = 0;
    
    for (const document of documents) {
      try {
        const originalData = document.data;
        const parsedFilename = parseFileName(originalData.filename || originalData.title || '');
        const enrichedData = enrichDocumentData(originalData, parsedFilename);
        
        // Update the document
        const docRef = doc(db, 'indexed_videos', document.id);
        updateBatch.update(docRef, enrichedData);
        
        processedCount++;
        
        if (processedCount % 100 === 0) {
          console.log(`📈 Processed ${processedCount}/${documents.length} documents`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing document ${document.id}:`, error);
      }
    }
    
    // 4. Commit all updates
    console.log('💾 Committing updates...');
    await updateBatch.commit();
    
    // 5. Generate summary report
    console.log('📊 Generating summary report...');
    const updatedSnapshot = await getDocs(videosRef);
    const categoryStats = {};
    const sessionTypeStats = {};
    
    updatedSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Category stats
      const category = data.category || 'unknown';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
      
      // Session type stats
      const sessionType = data.sessionType || 'unknown';
      sessionTypeStats[sessionType] = (sessionTypeStats[sessionType] || 0) + 1;
    });
    
    const report = {
      totalDocuments: documents.length,
      processedDocuments: processedCount,
      reindexedAt: new Date().toISOString(),
      categoryBreakdown: categoryStats,
      sessionTypeBreakdown: sessionTypeStats,
      knowledgeBaseCategories: Object.keys(KNOWLEDGE_BASE_CATEGORIES),
      dataVersion: '2.0'
    };
    
    // Save report to Firebase
    await addDoc(collection(db, 'reindex_reports'), report);
    
    console.log('✅ Reindexing completed successfully!');
    console.log('📊 Summary Report:');
    console.log(`   Total documents: ${report.totalDocuments}`);
    console.log(`   Processed: ${report.processedDocuments}`);
    console.log('   Category breakdown:', report.categoryBreakdown);
    console.log('   Session type breakdown:', report.sessionTypeBreakdown);
    
    return report;
    
  } catch (error) {
    console.error('❌ Reindexing failed:', error);
    throw error;
  }
}

// Helper function to validate reindexing
async function validateReindexing() {
  console.log('🔍 Validating reindexing results...');
  
  const videosRef = collection(db, 'indexed_videos');
  const snapshot = await getDocs(videosRef);
  
  const issues = [];
  let validCount = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    
    // Check for required fields
    if (!data.category || data.category === 'General Coaching') {
      issues.push(`Document ${doc.id}: Invalid or missing category`);
    }
    
    if (!data.reindexedAt) {
      issues.push(`Document ${doc.id}: Missing reindexedAt timestamp`);
    }
    
    if (!data.tags || data.tags.length === 0) {
      issues.push(`Document ${doc.id}: Missing or empty tags`);
    }
    
    if (data.reindexedAt && data.category && data.category !== 'General Coaching') {
      validCount++;
    }
  });
  
  console.log(`✅ Validation complete: ${validCount} valid documents, ${issues.length} issues found`);
  
  if (issues.length > 0) {
    console.log('⚠️  Issues found:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  return {
    validCount,
    totalCount: snapshot.size,
    issues
  };
}

// Export functions
module.exports = {
  reindexFirebaseData,
  validateReindexing,
  parseFileName,
  determineCategoryFromPath,
  enrichDocumentData
};

// CLI execution
if (typeof require !== 'undefined' && require.main === module) {
  reindexFirebaseData()
    .then(report => {
      console.log('🎉 Reindexing completed successfully!');
      console.log('Report saved to Firebase');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Reindexing failed:', error);
      process.exit(1);
    });
}