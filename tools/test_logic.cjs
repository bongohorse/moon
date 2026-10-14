// Fengari CLI can print an uncaught Lua error yet exit zero. Require suite completion too.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const result=spawnSync(path.join(__dirname,'../node_modules/.bin/fengari'),[process.argv[2]||'tests/logic.lua'],{encoding:'utf8',timeout:30000});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
if(result.error||result.status!==0||!/^\d+ assertions passed$/m.test(result.stdout||'')) {
  console.error('Lua suite did not complete successfully.');process.exit(1);
}
