const assert = require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const {extractPackageFile}=await import('renovate/dist/modules/manager/custom/regex/index.js');
  const config=JSON.parse(fs.readFileSync('renovate.json'));
  const result=await extractPackageFile(fs.readFileSync('tools/defold-version.env','utf8'),'tools/defold-version.env',config.customManagers[0]);
  assert.equal(result.deps.length,1);
  assert.equal(result.deps[0].depName,'defold/defold');
  assert.equal(result.deps[0].datasource,'github-releases');
  assert.match(result.deps[0].currentValue,/^\d+\.\d+\.\d+$/);
  console.log('Renovate native extractor: one stable Defold dependency extracted');
})();
