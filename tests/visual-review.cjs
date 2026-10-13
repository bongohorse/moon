// Capture review evidence without changing simulation state or physical defaults.
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
  const mode=process.argv[2]||'after';assert(['before','after'].includes(mode));
  const dir=path.join('docs','visual-review',mode);fs.mkdirSync(dir,{recursive:true});
  const server=spawn('python3',['-m','http.server','8771','--directory','dist/wasm-web'],{stdio:'ignore'});
  const browser=await chromium.launch({args:['--no-sandbox']});
  try {
    const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];
    page.on('console',m=>{if(m.text().includes('ERROR:'))errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8771/MOON/');await page.waitForFunction(()=>window.moonTelemetry,{},{timeout:30000});
    await page.locator('canvas').click();
    const snap=name=>page.screenshot({path:path.join(dir,name+'.png')});
    const reset=async()=>{await page.keyboard.press('r',{delay:80});await page.waitForTimeout(800)};
    const tuning=async()=>{const b=await page.locator('canvas').boundingBox();const s=Math.min(b.width/1280,b.height/720);await page.mouse.click(b.x+b.width-409*s,b.y+32*s,{delay:80});await page.waitForTimeout(200)};
    for(const size of [{width:1280,height:720},{width:1024,height:768},{width:1920,height:864}]) {
      await page.setViewportSize(size);await reset();await page.keyboard.press('Space',{delay:80});await snap('start-'+size.width);
      if(mode==='after'){await tuning();await snap('tuning-'+size.width);await tuning()}
    }
    await page.setViewportSize({width:1280,height:720});await reset();await page.keyboard.press('Space',{delay:80});await tuning();await snap('tuning');await tuning();
    if(mode==='after'&&!process.argv.includes('--layout-only')) {
      await reset();await page.keyboard.down('a');await page.waitForTimeout(200);await snap('brake-pressed');await page.keyboard.up('a');
      await page.keyboard.down('d');await page.waitForTimeout(200);await snap('gas-pressed');let maximum=-Infinity,minimum=Infinity,targetMaximum=-Infinity,targetMinimum=Infinity;
      let airborne=false,landed=false;const events={};
      // Pause with the normal key before capture: software screenshot readback can
      // take multiple live frames. Record the frozen pose, not an earlier sample.
      const capture=async(name,accept=()=>true)=>{
        await page.keyboard.up('d');await page.keyboard.press('Space',{delay:80});await page.waitForTimeout(150);
        const pose=await page.evaluate(()=>window.moonTelemetry);assert(pose.paused);
        if(accept(pose)){await snap(name);events[name]=pose}
        await page.keyboard.press('Space',{delay:80});await page.keyboard.down('d');return pose;
      };
      for(let i=0;i<180;i++) {
        await page.waitForTimeout(80);const t=await page.evaluate(()=>window.moonTelemetry);if(t.finished)break;
        if(t.suspension>targetMaximum+.5){targetMaximum=t.suspension;await capture('compression',pose=>{
          if(pose.suspension<=maximum)return false;maximum=pose.suspension;return true;
        })}
        if(t.suspension<targetMinimum-.5){targetMinimum=t.suspension;await capture('extension',pose=>{
          if(pose.suspension>=minimum)return false;minimum=pose.suspension;return true;
        })}
        if(!airborne&&t.x>650&&t.y>380&&!t.grounded){const pose=await capture('jump',p=>!p.grounded);airborne=!pose.grounded}
        if(airborne&&!landed&&t.grounded&&t.suspension>0){const pose=await capture('landing',p=>p.grounded);landed=pose.grounded}
        if(t.finished)break;
      }
      await page.keyboard.up('d');assert(airborne&&landed,'jump and compressed touchdown captured');
      fs.writeFileSync(path.join(dir,'observations.json'),JSON.stringify({maximum,minimum,events,limits:'Observed extrema during this default-track run, not a forced joint travel limit. Headless browser; zero reported browser safe-area insets; no native device.'},null,2));
    }
    assert.deepEqual(errors,[]);console.log('Captured '+mode+' visual evidence without runtime errors');
  } finally {await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
