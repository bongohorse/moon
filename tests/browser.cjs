const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
(async()=>{
  fs.mkdirSync('test-results',{recursive:true});
  const server=process.env.MOON_URL?null:spawn('python3',['-m','http.server','8767','--directory','dist/wasm-web'],{stdio:'ignore'});
  const url=process.env.MOON_URL||'http://127.0.0.1:8767/MOON/';
  let browser;
  const report=[];
  try {
    browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    const errors=[]; let backend=false;
    page.on('console',m=>{if(m.text().includes('ERROR:'))errors.push(m.text());if(m.text().includes('Box2D v2.2.1'))backend=true});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(()=>window.moonTelemetry,{},{timeout:30000});
    const telemetry=()=>page.evaluate(()=>window.moonTelemetry);
    const wait=ms=>page.waitForTimeout(ms);
    const restart=async()=>{await page.keyboard.press('r',{delay:80});await wait(600)};
    const click=async(x,y)=>{const b=await page.locator('canvas').boundingBox();await page.mouse.click(b.x+b.width*x,b.y+b.height*y)};
    await page.locator('canvas').click();
    await restart();
    const baseline=await telemetry(); assert(baseline.grounded); assert(backend);
    await page.keyboard.down('d');await wait(1600);
    const driving=await telemetry();assert(driving.distance>30);assert(driving.speed>250);
    await page.keyboard.down('a');await wait(500);
    const braking=await telemetry();assert(braking.brake&&!braking.gas);assert(Math.abs(braking.speed)<Math.abs(driving.speed)*0.7);
    await page.keyboard.up('d');await page.keyboard.up('a');report.push('keyboard acceleration, braking and both-pedal priority');
    await restart();
    await page.keyboard.down('d');await wait(200);
    await page.keyboard.press('Space',{delay:80});await wait(200);
    const paused=await telemetry();assert(paused.paused&&!paused.gas);
    await wait(500);assert(Math.abs((await telemetry()).x-paused.x)<1);
    await page.keyboard.up('d');await page.keyboard.press('Space',{delay:80});await wait(300);assert(!(await telemetry()).paused);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await wait(300);
    assert((await telemetry()).paused);
    await page.keyboard.press('Space',{delay:80});await wait(200);assert(!(await telemetry()).paused);
    report.push('pause freezes bodies, resume and focus-loss clear input');
    for(let i=0;i<5;i++){await restart();assert((await telemetry()).distance===0)}
    report.push('five repeated restarts');
    await click(0.674,0.045); // tuning header
    await click(0.422,0.163); // gravity +
    const pending=await telemetry();assert(pending.dirty);assert(pending.pendingGravity>pending.gravity);
    await click(0.406,0.41);await wait(500);
    const applied=await telemetry();assert(!applied.dirty);assert(applied.gravity===pending.pendingGravity);
    await click(0.674,0.045);report.push('collapsed tuning, bounded staged settings and apply/restart');
    // Reset defaults through the panel before driving the default configuration.
    await click(0.674,0.045);await click(0.574,0.41);await click(0.406,0.41);await wait(500);await click(0.674,0.045);
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
    const b=await page.locator('canvas').boundingBox();
    const left={x:b.x+b.width*0.12,y:b.y+b.height*0.9,id:1};
    const right={x:b.x+b.width*0.88,y:b.y+b.height*0.9,id:2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right]});await wait(200);
    let t=await telemetry();assert(t.brake&&!t.gas,'two-finger braking');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[right]});await wait(500);
    t=await telemetry();assert(t.gas&&!t.brake,'release brake keeps gas');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(200);
    t=await telemetry();assert(!t.gas&&!t.brake);report.push('CDP emulated two-finger touch and independent releases');
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});
    await restart();await page.keyboard.down('d');
    const samples=[];
    for(let i=0;i<180;i++){await wait(100);t=await telemetry();samples.push(t);if(t.finished)break}
    await page.keyboard.up('d');
    assert(t.finished,'default rover reaches visible finish');
    assert(t.airFrames>0&&t.landings>0,'jump and landing executed');
    const suspension=samples.map(s=>s.suspension);assert(Math.max(...suspension)-Math.min(...suspension)>3);
    report.push(`default track completed: ${t.distance} m, ${t.airFrames} airborne steps, ${t.landings} landings; suspension moved`);
    await page.screenshot({path:'test-results/finish.png'});
    for(const size of [{width:1024,height:768},{width:1920,height:864}]){
      await page.setViewportSize(size);await restart();await wait(200);await click(0.9,0.9);await wait(100);
      assert(!(await telemetry()).paused);await page.screenshot({path:`test-results/${size.width}x${size.height}.png`});
    }
    report.push('4:3 tablet and wide-phone viewport startup/screenshots');
    assert.deepEqual(errors,[],'no Lua/JavaScript runtime errors');
    fs.writeFileSync('test-results/report.json',JSON.stringify({url,checks:report,limitations:['Headless Chromium, software rendering; no physical device or FPS certification.']},null,2));
    console.log(report.join('\n'));
  } finally {if(browser)await browser.close();if(server)server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
