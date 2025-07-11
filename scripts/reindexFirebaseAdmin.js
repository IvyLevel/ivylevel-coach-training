// reindexFirebaseAdmin.js - Production-grade Firebase reindexing using Admin SDK
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Configuration
const BATCH_SIZE = 500; // Firestore batch limit
const COLLECTION_NAME = 'indexed_videos';
const BACKUP_COLLECTION = 'indexed_videos_backup_' + new Date().toISOString().split('T')[0];

// Initialize Admin SDK
function initializeAdmin() {
  // Check for service account key file
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account key not found at:', serviceAccountPath);
    console.log('\n📋 To set up the service account:');
    console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('2. Click "Generate new private key"');
    console.log('3. Save the file as "serviceAccountKey.json" in the project root');
    console.log('4. Add serviceAccountKey.json to .gitignore (IMPORTANT!)');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });

  console.log('✅ Admin SDK initialized for project:', serviceAccount.project_id);
  return admin.firestore();
}

// Category mapping logic
const CATEGORY_MAPPINGS = {
  'game_plan': {
    patterns: [/game\s*plan/i, /gameplan/i, /assessment.*initial/i],
    category: 'game_plan_reports',
    sessionType: 'game_plan_session'
  },
  'execution': {
    patterns: [/execution/i, /action\s*items/i, /follow[\s-]*up/i, /progress\s*report/i],
    category: 'execution_documents',
    sessionType: 'execution_session'
  },
  'training': {
    patterns: [/training/i, /onboarding/i, /guideline/i, /template/i, /coach.*resource/i],
    category: 'coach_resources',
    sessionType: 'training_material'
  },
  'check_in': {
    patterns: [/check[\s-]*in/i, /quick.*check/i, /brief.*session/i],
    category: 'student_sessions',
    sessionType: 'check_in_session'
  }
};

function categorizeDocument(data) {
  const searchText = `${data.title || ''} ${(data.tags || []).join(' ')} ${data.filename || ''}`.toLowerCase();
  
  // Check each category mapping
  for (const [key, config] of Object.entries(CATEGORY_MAPPINGS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(searchText)) {
        return {
          category: config.category,
          sessionType: config.sessionType
        };
      }
    }
  }
  
  // Default to student sessions
  return {
    category: 'student_sessions',
    sessionType: 'coaching_session'
  };
}

// Enhanced student name parser
function parseStudentInfo(data) {
  const title = data.title || '';
  const filename = data.filename || '';
  const parsedStudent = data.parsedStudent || '';
  
  // Common patterns in your data
  const patterns = [
    // "Coach & Student - Week XX" format
    /(?:[A-Za-z]+)\s*&\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*-/,
    // "Student - Week XX" format
    /^([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*-\s*Week/,
    // From filename patterns
    /_([A-Za-z]+(?:\s+[A-Za-z]+)?)_Week/,
    // Special case for "B" which seems to be a student name
    /(?:^|\s|&)\s*B\s*(?:-|$)/
  ];
  
  for (const pattern of patterns) {
    const titleMatch = title.match(pattern);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
    
    const filenameMatch = filename.match(pattern);
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].trim();
    }
  }
  
  // Return existing parsed student if available
  return parsedStudent;
}

// Create backup with progress tracking
async function createBackup(db, documents) {
  console.log(`\n💾 Creating backup to collection: ${BACKUP_COLLECTION}`);
  
  const totalBatches = Math.ceil(documents.length / BATCH_SIZE);
  let processedDocs = 0;
  
  for (let i = 0; i < totalBatches; i++) {
    const batch = db.batch();
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, documents.length);
    
    for (let j = start; j < end; j++) {
      const doc = documents[j];
      const backupRef = db.collection(BACKUP_COLLECTION).doc(doc.id);
      batch.set(backupRef, {
        ...doc.data,
        backedUpAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();
    processedDocs = end;
    console.log(`   Backed up ${processedDocs}/${documents.length} documents (${Math.round(processedDocs/documents.length*100)}%)`);
  }
  
  console.log('✅ Backup completed successfully\n');
}

// Main reindexing function
async function reindexFirebase() {
  const startTime = Date.now();
  console.log('🚀 Starting Production-Grade Firebase Reindexing\n');
  
  try {
    const db = initializeAdmin();
    
    // 1. Fetch all documents
    console.log(`📥 Fetching documents from ${COLLECTION_NAME}...`);
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const documents = [];
    
    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    console.log(`✅ Found ${documents.length} documents\n`);
    
    // 2. Analyze current state
    const stats = {
      total: documents.length,
      generalCoaching: 0,
      alreadyCategorized: 0,
      gamePlans: 0,
      needsUpdate: []
    };
    
    documents.forEach(doc => {
      if (doc.data.category === 'General Coaching') {
        stats.generalCoaching++;
        stats.needsUpdate.push(doc);
      } else if (doc.data.category && doc.data.category !== 'General Coaching') {
        stats.alreadyCategorized++;
      }
    });
    
    console.log('📊 Current State Analysis:');
    console.log(`   Total documents: ${stats.total}`);
    console.log(`   General Coaching (needs update): ${stats.generalCoaching}`);
    console.log(`   Already categorized: ${stats.alreadyCategorized}`);
    console.log(`   Other/Uncategorized: ${stats.total - stats.generalCoaching - stats.alreadyCategorized}\n`);
    
    if (stats.needsUpdate.length === 0) {
      console.log('✅ No documents need updating!');
      return;
    }
    
    // 3. Create backup (optional but recommended)
    const createBackupPrompt = true; // Set to false to skip backup
    if (createBackupPrompt) {
      await createBackup(db, stats.needsUpdate);
    }
    
    // 4. Update documents in batches
    console.log('🔄 Reindexing documents...\n');
    
    const totalBatches = Math.ceil(stats.needsUpdate.length / BATCH_SIZE);
    let processedDocs = 0;
    let updatedCategories = {};
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = db.batch();
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, stats.needsUpdate.length);
      
      for (let j = start; j < end; j++) {
        const doc = stats.needsUpdate[j];
        const docRef = db.collection(COLLECTION_NAME).doc(doc.id);
        
        // Categorize document
        const categorization = categorizeDocument(doc.data);
        
        // Parse student info
        const studentName = parseStudentInfo(doc.data);
        
        // Prepare update
        const updateData = {
          category: categorization.category,
          sessionType: categorization.sessionType,
          reindexedAt: admin.firestore.FieldValue.serverTimestamp(),
          dataVersion: '2.0',
          indexingMethod: 'admin_sdk_production'
        };
        
        // Add student name if found and not already present
        if (studentName && !doc.data.parsedStudent) {
          updateData.parsedStudent = studentName;
        }
        
        // Track category distribution
        updatedCategories[categorization.category] = (updatedCategories[categorization.category] || 0) + 1;
        
        // Track Game Plans
        if (categorization.category === 'game_plan_reports') {
          stats.gamePlans++;
          console.log(`   📋 Game Plan found: ${doc.data.title}`);
        }
        
        batch.update(docRef, updateData);
      }
      
      await batch.commit();
      processedDocs = end;
      console.log(`\n✅ Batch ${i + 1}/${totalBatches} complete (${processedDocs}/${stats.needsUpdate.length} documents)`);
    }
    
    // 5. Verify results
    console.log('\n📊 Reindexing Complete! Verifying results...\n');
    
    const verifySnapshot = await db.collection(COLLECTION_NAME)
      .where('dataVersion', '==', '2.0')
      .get();
    
    console.log('✅ Verification Results:');
    console.log(`   Documents updated: ${verifySnapshot.size}`);
    console.log(`   Game Plans identified: ${stats.gamePlans}`);
    
    console.log('\n📊 New Category Distribution:');
    Object.entries(updatedCategories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });
    
    // 6. Final summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n🎉 Reindexing completed successfully!');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`📁 Backup collection: ${BACKUP_COLLECTION}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Test Smart Onboarding to verify Abhi\'s Game Plan appears');
    console.log('2. Check Firebase Console to confirm category updates');
    console.log('3. Monitor application logs for any issues');
    console.log('4. Delete backup collection after verification (optional)');
    
    // 7. Generate detailed report
    const report = {
      timestamp: new Date().toISOString(),
      duration: duration + ' seconds',
      documentsProcessed: stats.needsUpdate.length,
      gamePlansFound: stats.gamePlans,
      categoryDistribution: updatedCategories,
      backupCollection: BACKUP_COLLECTION,
      status: 'success'
    };
    
    // Save report to Firestore
    await db.collection('reindex_reports').add(report);
    console.log('\n📄 Detailed report saved to reindex_reports collection');
    
  } catch (error) {
    console.error('\n❌ Reindexing failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  reindexFirebase()
    .then(() => {
      console.log('\n✅ Process completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { reindexFirebase };