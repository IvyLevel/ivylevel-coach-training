// validateReindexing.js - Validate reindexing results
const { validateReindexing } = require('./reindexFirebaseData.js');

console.log('🔍 Validating Firebase reindexing results...\n');

async function runValidation() {
  try {
    const result = await validateReindexing();
    
    console.log('📊 Validation Results:');
    console.log(`   ✅ Valid documents: ${result.validCount}`);
    console.log(`   📁 Total documents: ${result.totalCount}`);
    console.log(`   ⚠️  Issues found: ${result.issues.length}\n`);
    
    if (result.issues.length > 0) {
      console.log('🔍 Issues to resolve:');
      result.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('🎉 All documents are properly indexed!');
    }
    
    const successRate = ((result.validCount / result.totalCount) * 100).toFixed(1);
    console.log(`\n📈 Success rate: ${successRate}%`);
    
    if (successRate >= 90) {
      console.log('✅ Reindexing quality is excellent!');
    } else if (successRate >= 70) {
      console.log('⚠️  Reindexing quality is good but could be improved.');
    } else {
      console.log('❌ Reindexing quality needs improvement.');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    return null;
  }
}

// Run validation
if (require.main === module) {
  runValidation()
    .then(result => {
      if (result) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    });
}

module.exports = { runValidation };