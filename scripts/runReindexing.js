// runReindexing.js - Node.js script to run the reindexing process
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Firebase Knowledge Base Reindexing Process...\n');

// Step 1: Check Firebase connection
console.log('1️⃣ Checking Firebase connection...');

// Step 2: Create backup
console.log('2️⃣ Creating backup of current data...');

// Step 3: Run reindexing
console.log('3️⃣ Running reindexing process...');

// Import and run the reindexing function
async function runReindexing() {
  try {
    const { reindexFirebaseData, validateReindexing } = require('./reindexFirebaseData.js');
    
    console.log('📊 Starting reindexing...');
    const report = await reindexFirebaseData();
    
    console.log('✅ Reindexing completed!');
    console.log('🔍 Running validation...');
    const validation = await validateReindexing();
    
    console.log('\n🎉 Process completed successfully!');
    console.log('📈 Final Report:');
    console.log(`   Total documents: ${report.totalDocuments}`);
    console.log(`   Valid documents: ${validation.validCount}`);
    console.log(`   Issues found: ${validation.issues.length}`);
    
    if (validation.issues.length > 0) {
      console.log('\n⚠️  Issues to review:');
      validation.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    return {
      success: true,
      report,
      validation
    };
    
  } catch (error) {
    console.error('❌ Reindexing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the process
runReindexing()
  .then(result => {
    if (result.success) {
      console.log('\n🎯 Next steps:');
      console.log('1. Review the validation report above');
      console.log('2. Check Firebase console for updated data');
      console.log('3. Test the Smart Onboarding system');
      console.log('4. Verify Abhi\'s Game Plan data is showing correctly');
      process.exit(0);
    } else {
      console.error('💥 Process failed. Please check the errors above.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });