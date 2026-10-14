// Capture review evidence without changing simulation state or physical defaults.
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
  const mode=process.argv[2]||'after';assert(['before','after'].includes(mode));
  const dir=path.join(process.env.MOON_CAPTURE_ROOT||path.join('docs','visual-review'),mode);fs.mkdirSync(dir,{recursive:true});
  const server=process.env.MOON_CAPTURE_URL?null:spawn('python3',['-m','http.server','8771','--directory','dist/wasm-web'],{stdio:'ignore'});
  const browser=await chromium.launch({args:['--no-sandbox']});
  try {
    const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];
    page.on('console',m=>{if(m.text().includes('ERROR:'))errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.MOON_CAPTURE_URL||'http://127.0.0.1:8771/MOON/');await page.waitForFunction(()=>window.moonTelemetry,{},{timeout:30000});
    await page.locator('canvas').click();
    const snap=name=>page.screenshot({path:path.join(dir,name+'.png')});
    const reset=async()=>{
      for(const key of ['d','a','Space','r'])await page.keyboard.up(key);
      const count=await page.evaluate(()=>window.moonTelemetry.restarts);
      await page.keyboard.down('r');
      await page.waitForFunction(n=>window.moonTelemetry.restarts>n&& !window.moonTelemetry.paused,count,{timeout:5000});
      await page.keyboard.up('r');await page.waitForTimeout(800);
    };
    const pause=async()=>{await page.keyboard.down('Space');await page.waitForFunction(()=>window.moonTelemetry.paused,{},{timeout:5000});await page.keyboard.up('Space')};
    const gas=async()=>{await page.keyboard.down('d');await page.waitForFunction(()=>window.moonTelemetry.gas,{},{timeout:5000})};
    const tuning=async()=>{
      const b=await page.locator('canvas').boundingBox();const s=Math.min(b.width/1280,b.height/720);
      const prior=await page.evaluate(()=>window.moonTelemetry.tuningOpen);
      if(typeof prior==='boolean'){
        const control=Math.max(140*s,108),dev=Math.max(160*s,100);
        const x=b.x+b.width-24*s-2*control-Math.max(10*s,6)-Math.max(15*s,6)-dev/2;
        await page.mouse.move(x,b.y+Math.max(32*s,30));await page.mouse.down();
        await page.waitForFunction(old=>window.moonTelemetry.tuningOpen!==old,prior,{timeout:5000});await page.mouse.up();
      }else await page.mouse.click(b.x+b.width-409*s,b.y+32*s,{delay:80});
      await page.waitForTimeout(200);
    };
    for(const size of JSON.parse(process.env.MOON_CAPTURE_SIZES||'[{"width":1280,"height":720},{"width":1024,"height":768},{"width":1920,"height":864},{"width":960,"height":432}]')) {
      await page.setViewportSize(size);await reset();await pause();await snap('start-'+size.width);
      if(mode==='after'){await tuning();await snap('tuning-'+size.width);await tuning()}
    }
    await page.setViewportSize({width:1280,height:720});await reset();await pause();await tuning();await snap('tuning');await tuning();
    if(mode==='after'&&!process.argv.includes('--layout-only')) {
      await reset();await page.keyboard.down('a');await page.waitForTimeout(200);await snap('brake-pressed');await page.keyboard.up('a');
      await gas();await page.waitForTimeout(200);await snap('gas-pressed');
      await page.waitForFunction(()=>window.moonTelemetry.dustCount>0&&window.moonTelemetry.speed>200,{},{timeout:10000});
      await snap('driving-dust');await page.keyboard.up('d');
      const events={};
      // Independent drives avoid changing later landings with repeated photo pauses.
      // Hold pause until observed; software readback is then a frozen physical pose.
      const cases=[
        ['compression',t=>t.x>900&&t.grounded&&t.springSpanMin<8],
        ['extension',t=>t.x>650&&t.springSpanMax>38.6],
        ['jump',t=>t.x>650&&t.y>380&&!t.grounded],
        ['landing',t=>t.x>950&&t.landings>0&&t.grounded]
      ];
      for(const [name,predicate] of cases) {
        let captured=false;console.log('Capturing '+name);
        for(let attempt=0;attempt<3&&!captured;attempt++) {
          await reset();await gas();
          try {
            await page.waitForFunction(test=>eval('('+test+')')(window.moonTelemetry),predicate.toString(),{timeout:20000});
          } catch(error) {
            if(error.name!=='TimeoutError')throw error;
            console.log(name+' threshold missed in drive '+(attempt+1)+'; retrying from rest');continue;
          }
          await page.keyboard.up('d');await page.keyboard.down('Space');
          await page.waitForFunction(()=>window.moonTelemetry.paused||window.moonTelemetry.finished,{},{timeout:5000});
          await page.keyboard.up('Space');await page.waitForTimeout(150);
          const pose=await page.evaluate(()=>window.moonTelemetry);
          if(pose.finished||(name==='jump'&&pose.grounded)||(name==='landing'&&!pose.grounded))continue;
          assert(pose.paused);await snap(name);events[name]=pose;captured=true;
          if(name==='jump'){await tuning();await snap('tuning-jump');await tuning()}
        }
        assert(captured,'frozen '+name+' pose captured');
      }
      fs.writeFileSync(path.join(dir,'observations.json'),JSON.stringify({events,
        limits:'Independent default-track drives; compressed/extended threshold events observed across both wheels, not forced mechanical travel limits. Frozen telemetry matches each pose. Headless browser; zero safe-area insets; no native device.'},null,2));
    }
    assert.deepEqual(errors,[]);console.log('Captured '+mode+' visual evidence without runtime errors');
  } finally {await browser.close();if(server)server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
