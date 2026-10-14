const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
(async()=>{
  fs.mkdirSync('test-results',{recursive:true});fs.rmSync('test-results/report.json',{force:true});
  const server=process.env.MOON_URL?null:spawn('python3',['-m','http.server','8767','--directory','dist/wasm-web'],{stdio:'ignore'});
  const url=process.env.MOON_URL||'http://127.0.0.1:8767/MOON/';
  let browser;
  const report=[];
  const record=report.push.bind(report);report.push=(...items)=>{console.log(...items);return record(...items)};
  try {
    browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    const errors=[]; let backend=false;
    page.on('console',m=>{if(m.text().includes('ERROR:'))errors.push(m.text());if(m.text().includes('Box2D v3.1.0'))backend=true});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(()=>window.moonTelemetry,{},{timeout:30000});
    const telemetry=()=>page.evaluate(()=>window.moonTelemetry);
    const wait=ms=>page.waitForTimeout(ms);
    const restart=async()=>{await page.keyboard.press('r',{delay:80});await wait(600)};
    const click=async(x,y)=>{const b=await page.locator('canvas').boundingBox();await page.mouse.click(b.x+b.width*x,b.y+b.height*y,{delay:80});await wait(100)};
    // A cold launch must work without a reload, focus click, or initial restart.
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    const cold=await telemetry();assert(!cold.paused,'initial loading blur does not lock controls');
    await page.evaluate(()=>window.dispatchEvent(new Event('focus'))); // restore actual GLFW focus before waiting for physics sleep
    await page.waitForFunction(()=>!window.moonTelemetry.awake,{},{timeout:8000});
    const cb=await page.locator('canvas').boundingBox();
    await page.mouse.move(cb.x+cb.width*.88,cb.y+cb.height*.9);await page.mouse.down();
    await page.waitForFunction(()=>window.moonTelemetry.distance>10&&window.moonTelemetry.gas,{},{timeout:8000});
    await page.mouse.up();report.push('cold first-load gas wakes the sleeping rover without reload or restart');
    await restart();
    const baseline=await telemetry(); assert(baseline.grounded); assert(backend);await page.screenshot({path:'test-results/start.png'});
    await page.keyboard.down('d');
    await page.waitForFunction(()=>window.moonTelemetry.distance>30&&window.moonTelemetry.speed>250,{},{timeout:8000});
    const driving=await telemetry();assert(driving.distance>30);assert(driving.speed>250);assert(driving.dustEmitted>baseline.dustEmitted,'ground-contact dust emitted');assert(driving.dustCount<=8);
    await page.keyboard.down('a');
    await page.waitForFunction(limit=>window.moonTelemetry.brake&&Math.abs(window.moonTelemetry.speed)<limit,Math.abs(driving.speed)*0.7,{timeout:4000});
    const braking=await telemetry();assert(braking.brake&&!braking.gas);assert(Math.abs(braking.speed)<Math.abs(driving.speed)*0.7);
    await page.keyboard.up('d');await page.keyboard.up('a');report.push('keyboard acceleration, braking and both-pedal priority');
    await restart();
    await page.keyboard.down('d');await wait(200);
    await page.keyboard.press('Space',{delay:80});await wait(200);
    const paused=await telemetry();assert(paused.paused&&!paused.gas);assert(paused.dustCount===0,'pause clears cosmetic particles');
    await wait(500);assert(Math.abs((await telemetry()).x-paused.x)<1);assert((await telemetry()).dustEmitted===paused.dustEmitted);
    await page.keyboard.up('d');await page.keyboard.press('Space',{delay:80});await wait(300);assert(!(await telemetry()).paused);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await wait(300);
    assert((await telemetry()).paused);
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await wait(100);assert((await telemetry()).paused,'regaining focus still requires explicit resume');
    await page.keyboard.press('Space',{delay:80});await wait(200);assert(!(await telemetry()).paused);
    report.push('pause freezes bodies, resume and focus-loss clear input');
    for(let i=0;i<5;i++){await restart();assert((await telemetry()).distance===0);assert((await telemetry()).battery===100&&(await telemetry()).stars===0)}
    report.push('five repeated restarts');
    await click(0.674,0.045); await page.screenshot({path:'test-results/tuning.png'}); // tuning header
    await click(0.422,0.145); // gravity +
    const pending=await telemetry();assert(pending.dirty);assert(pending.pendingGravity>pending.gravity);
    await click(0.406,0.327);await wait(500);
    const applied=await telemetry();assert(!applied.dirty);assert(applied.gravity===pending.pendingGravity);
    await click(0.674,0.045);report.push('collapsed tuning, bounded staged settings and apply/restart');
    // Reset defaults through the panel before driving the default configuration.
    await click(0.674,0.045);await click(0.574,0.327);await click(0.406,0.327);await wait(500);await click(0.674,0.045);
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
    const b=await page.locator('canvas').boundingBox();
    const left={x:b.x+b.width*0.12,y:b.y+b.height*0.9,id:1};
    const right={x:b.x+b.width*0.88,y:b.y+b.height*0.9,id:2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right]});await wait(200);
    let t=await telemetry();assert(t.brake&&!t.gas,'two-finger braking');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[left]});await wait(500);
    t=await telemetry();assert(t.gas&&!t.brake,'release brake keeps gas');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(200);
    t=await telemetry();assert(!t.gas&&!t.brake);report.push('CDP emulated two-finger touch and independent releases');
    const uiScale=Math.min(b.width/1280,b.height/720);
    const margin={x:b.x+b.width-144*uiScale,y:b.y+b.height-136*uiScale,id:3};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[margin]});await wait(200);
    t=await telemetry();assert(t.gas&&!t.brake,'transparent upper pedal margin retains full touch rectangle');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(200);
    report.push('transparent image margin uses the separate full pedal touch area');
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});
    await restart();await page.keyboard.down('d');
    await page.waitForFunction(()=>window.moonTelemetry.x>650&&!window.moonTelemetry.grounded&&window.moonTelemetry.clearance>110&&Math.abs(window.moonTelemetry.spin)<2,{},{timeout:8000});
    const airborne=await telemetry();
    await page.keyboard.down('a');await wait(140);
    const noseDown=await telemetry();
    assert(noseDown.brake&&!noseDown.gas);assert(!noseDown.grounded,'air-brake sample remains airborne');assert(noseDown.spin<airborne.spin,'air brake reduces nose-up spin: '+JSON.stringify({airborne,noseDown}));
    await page.keyboard.up('a');await page.keyboard.up('d');
    report.push('airborne brake changes physical angular velocity toward nose-down');
    await restart();await page.keyboard.down('d');
    const samples=[];
    for(const target of [2650,5550,8650,11000]) {
      const deadline=Date.now()+90000;
      while((t=await telemetry()).x<target-400||!t.grounded) {
        assert(Date.now()<deadline,'rover reaches next solar station: '+JSON.stringify(t));
        assert(!t.paused,'rover stays upright');
        samples.push(t);await wait(100);
      }
      assert(t.x<target+250,'rounded landing arrives inside solar approach');
      await page.keyboard.down('a');await page.keyboard.up('d');
      try {await page.waitForFunction(()=>window.moonTelemetry.charging,{},{timeout:5000})}
      catch(e) {console.error('Solar stop failed',target,await telemetry());await page.screenshot({path:'test-results/solar-error.png'});throw e}
      const charging=await telemetry();assert(charging.station>0&&charging.battery<100);console.log('Solar stop',target,'battery',charging.battery,'x',charging.x);
      await page.screenshot({path:`test-results/solar-${target}.png`});
      if(target===2650) {
        await page.keyboard.press('Space',{delay:80});await wait(200);
        const held=await telemetry();await wait(400);assert(Math.abs((await telemetry()).battery-held.battery)<.001,'pause freezes solar energy');
        await page.keyboard.press('Space',{delay:80});await wait(200);
        await page.keyboard.up('a');await page.keyboard.down('a'); // pause intentionally cleared held input
      }
      await page.waitForFunction(()=>window.moonTelemetry.battery>=99.99,{},{timeout:8000});
      if(target===2650)await page.waitForFunction(()=>!window.moonTelemetry.awake,{},{timeout:8000});
      await page.keyboard.up('a');await page.keyboard.down('d');
    }
    const deadline=Date.now()+90000;
    while(!(t=await telemetry()).finished&&Date.now()<deadline) {samples.push(t);await wait(100)}
    await page.keyboard.up('d');
    assert(t.finished,'default rover reaches visible finish');assert(t.distance>=1222);assert(t.stars>15,'physical route collects stars');assert(t.battery>0,'solar stops sustain entire route');
    report.push('four functional solar stops, paused charging, collected stars and 1.2 km finish');
    assert(t.airFrames>0&&t.landings>0,'jump and landing executed');
    assert(samples.every(s=>s.dustCount<=8&&s.artSprites<=128&&s.terrainBodies<=90),'bounded particle/sprite pools');
    assert(samples.every(s=>s.springSpanMin>=0&&s.springSpanMax>=s.springSpanMin),'finite actual suspension graphics');
    report.push('ground-contact dust, paused emission and eight-particle/128-sprite ceilings');
    const suspension=samples.map(s=>s.suspension);assert(Math.max(...suspension)-Math.min(...suspension)>3);
    report.push(`default track completed: ${t.distance} m, ${t.airFrames} airborne steps, ${t.landings} landings; suspension moved`);
    await page.screenshot({path:'test-results/finish.png'});
    for(const size of [{width:1024,height:768},{width:1920,height:864},{width:960,height:432}]){
      await page.setViewportSize(size);await restart();await wait(200);await click(0.9,0.9);await wait(100);
      assert(!(await telemetry()).paused);await page.screenshot({path:`test-results/${size.width}x${size.height}.png`});
    }
    report.push('4:3 tablet, wide-phone and small 960x432 viewport startup/screenshots');
    // A normal full-power run without solar stops must exhaust energy before the finish.
    await page.setViewportSize({width:1280,height:720});await restart();
    await page.keyboard.down('d');
    try {await page.waitForFunction(()=>window.moonTelemetry.battery===0,{},{timeout:90000})}
    catch(e){console.error('Empty-battery scenario',await telemetry());await page.screenshot({path:'test-results/battery-error.png'});throw e}
    const empty=await telemetry();assert(empty.gas&&!empty.motorGas&&!empty.finished,'empty battery blocks powered gas');
    await page.screenshot({path:'test-results/battery-empty.png'});
    await page.keyboard.down('a');await wait(300);
    assert((await telemetry()).brake&&!(await telemetry()).gas,'brake available with empty battery');
    await page.keyboard.up('a');await page.keyboard.up('d');await restart();
    assert((await telemetry()).battery===100&&(await telemetry()).stars===0,'restart resets energy and stars after depletion');
    report.push('default run without solar stops fully empties battery; gas disables, brake remains available, restart recovers');
    // Fresh mobile-emulated context: the first touch must accelerate without reset/reload.
    const mobile=await browser.newContext({viewport:{width:960,height:432},isMobile:true,hasTouch:true});
    try {
      const first=await mobile.newPage();first.on('pageerror',e=>errors.push(e.message));first.on('console',m=>{if(m.text().includes('ERROR:'))errors.push(m.text())});await first.goto(url);await first.waitForFunction(()=>window.moonTelemetry,{},{timeout:30000});await first.waitForFunction(()=>!window.moonTelemetry.awake,{},{timeout:8000});
      const touch=await mobile.newCDPSession(first);const bounds=await first.locator('canvas').boundingBox();
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds.x+bounds.width*.88,y:bounds.y+bounds.height*.9,id:1}]});
      await first.waitForFunction(()=>window.moonTelemetry.distance>10&&window.moonTelemetry.gas,{},{timeout:8000});
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert((await first.evaluate(()=>window.moonTelemetry)).restarts===1,'no hidden restart needed for first touch');
      await first.screenshot({path:'test-results/first-mobile-touch.png'});
    } finally {await mobile.close()}
    report.push('isolated cold mobile-emulated first touch wakes sleeping rover without reload');
    assert.deepEqual(errors,[],'no Lua/JavaScript runtime errors');
    fs.writeFileSync('test-results/report.json',JSON.stringify({url,checks:report,route:{distance:t.distance,collectedStars:t.stars,totalStars:t.totalStars,batteryAtFinish:t.battery,solarStops:4},graphics:{maxSprites:Math.max(...samples.map(s=>s.artSprites)),maxTerrainBodies:Math.max(...samples.map(s=>s.terrainBodies)),maxDust:Math.max(...samples.map(s=>s.dustCount)),minSpan:Math.min(...samples.map(s=>s.springSpanMin)),maxSpan:Math.max(...samples.map(s=>s.springSpanMax))},limitations:['Headless Chromium, software rendering; no physical device or FPS certification.']},null,2));
    console.log(report.join('\n'));
  } finally {if(browser)await browser.close();if(server)server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
