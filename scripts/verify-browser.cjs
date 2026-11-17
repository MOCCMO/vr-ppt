/* Browser acceptance checks. PLAYWRIGHT_PATH may point to an existing Playwright installation. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/momo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'qa');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/ppt-manifest.json')));
const phase = process.argv[2] || 'lesson';
const results = [];
const errors = [];
const failedRequests = [];
const check = (name, detail) => { results.push({ name, status: 'pass', detail }); console.log('PASS', name, detail || ''); };
const shots = async (page, name) => page.screenshot({ path: path.join(out, name + '.jpg'), quality: 83, fullPage: true });
let browser;
(async () => {
  browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--disk-cache-size=0', '--media-cache-size=0', '--disable-gpu-shader-disk-cache', '--mute-audio', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['microphone'], acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle' });
  const frameReady = async (source) => page.waitForFunction(source => {
    const image = document.querySelector('.ppt-frame');
    return image && image.complete && image.naturalWidth > 0 && (!source || image.src.endsWith(source));
  }, source);
  const go = async n => { await page.evaluate(n => location.hash = `/lesson/${n}`, n); await frameReady(manifest.slides[n - 1].frames[0]); };
  const close = async () => { await page.getByRole('button', { name: '关闭窗口', exact: true }).last().click(); await page.locator('dialog').waitFor({ state: 'hidden' }); };
  if (phase === 'lesson') {
    await shots(page, '01-home-desktop');
    await page.getByRole('button', { name: '从第一页开始', exact: true }).click();
    let total = 0;
    for (const slide of manifest.slides) {
      for (let i = 0; i < slide.frames.length; i++) {
        await frameReady(slide.frames[i]);
        assert.equal(new URL(page.url()).hash, `#/lesson/${slide.page}`);
        if ([4, 5, 9, 12, 15, 18, 19, 22].includes(slide.page) && i === slide.frames.length - 1) await shots(page, `slide-${String(slide.page).padStart(2,'0')}-full`);
        total++;
        await page.locator('.player-next').click();
      }
      console.log('SLIDE', slide.page, 'OK', slide.frames.length, 'frames');
    }
    await page.locator('.ppt-home').waitFor();
    check('Original course traversal', `${manifest.slides.length} pages / ${total} source frames rendered; final step returned home`);
    const seasons = [['Winter',5],['Spring',8],['Summer',11],['Autumn',14]];
    assert.deepEqual(await page.locator('.ppt-portal strong').allTextContents(), seasons.map(s=>s[0]));
    for (const [season,n] of seasons) {
      await page.getByRole('button', { name: `进入 ${season} 原课件第 ${n} 页`, exact: true }).click();
      await frameReady(); assert.ok(page.url().endsWith(`#/lesson/${n}`));
      await page.getByRole('button', { name: 'Seasons 课程首页', exact: true }).click();
    }
    check('Season portals', 'Winter 5 → Spring 8 → Summer 11 → Autumn 14');
    await page.getByRole('button', { name: '四季地图', exact: true }).click();
    for (const [season,n] of seasons) {
      await page.getByRole('button', { name: `从地图进入 ${season.toLowerCase()}`, exact: true }).click();
      assert.ok(page.url().endsWith(`#/lesson/${n}`));
      await page.getByRole('button', { name: '四季旅程', exact: true }).click();
    }
    check('Original map hotspots', 'All four islands navigate to the source lesson');
    await page.getByRole('button', { name: '从地图进入 winter', exact: true }).click();
    await page.getByRole('button', { name: '重放本页', exact: true }).click();
    await frameReady('ppt-frames/05-00.webp');
    await page.keyboard.press('ArrowRight'); await frameReady('ppt-frames/05-01.webp');
    await page.keyboard.press('ArrowLeft'); await frameReady('ppt-frames/05-00.webp');
    await page.locator('.ppt-click-layer').click(); await frameReady('ppt-frames/05-01.webp');
    await page.reload(); await frameReady('ppt-frames/05-01.webp');
    await page.getByRole('button', { name: '显示完整页', exact: true }).click(); await frameReady('ppt-frames/05-10.webp');
    await page.getByRole('button', { name: '放大课件专注模式', exact: true }).click();
    assert.equal(await page.locator('.judy-guide').count(), 0);
    await shots(page, '02-focus-desktop'); await page.keyboard.press('Escape');
    await page.locator('.judy-guide').waitFor();
    check('Presentation controls', 'Click, left/right keyboard, reset, full slide, persisted steps, focus and Escape');
    await page.getByRole('button', { name: '听朱迪讲这页', exact: true }).click();
    await page.waitForFunction(() => Number(document.querySelector('.judy-3d-canvas')?.dataset.mouth || '0') > .12);
    await page.waitForFunction(() => parseFloat(document.querySelector('.judy-audio-progress span')?.style.width || '0') > 3);
    await shots(page, '03-judy-speaking');
    await page.getByRole('button', { name: '显示英语讲解文字', exact: true }).click();
    assert.match(await page.locator('.judy-speech p').textContent(), /Welcome to winter/);
    await page.getByRole('button', { name: '显示中文讲解文字', exact: true }).click();
    await page.getByRole('button', { name: '关闭声音', exact: true }).click();
    await page.locator('.judy-guide.is-speaking').waitFor({state:'hidden'});
    await page.getByRole('button', { name: '开启声音', exact: true }).click();
    await page.getByLabel('翻页时自动讲解', { exact: true }).check();
    await page.getByRole('button', { name: '直接下一页', exact: true }).click();
    await page.waitForFunction(() => Number(document.querySelector('.judy-3d-canvas')?.dataset.mouth || '0') > .1);
    await page.getByLabel('翻页时自动讲解', { exact: true }).uncheck();
    check('Judy voice guide', 'Actual audio progressed, phonetic mouth shapes, bilingual text, mute and page-follow verified');
    for (const [n,start] of [[9,2],[15,6]]) {
      await page.evaluate(n => location.hash = `/lesson/${n}`, n); await frameReady();
      await page.getByRole('button', { name: '重放本页', exact: true }).click(); await frameReady(`ppt-frames/${String(n).padStart(2,'0')}-00.webp`);
      assert.equal(await page.locator('.ppt-video-play').count(),0);
      await page.getByRole('button', { name: '播放原视频', exact: true }).click();
      await frameReady(`ppt-frames/${String(n).padStart(2,'0')}-${String(start).padStart(2,'0')}.webp`);
      await page.waitForFunction(() => { const v=document.querySelector('video'); return v && v.currentTime > .3 && !v.paused && v.videoWidth > 0; });
      const data=await page.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,captions:v.textTracks.length}));
      assert.ok(data.duration>6 && data.captions>0);
      await shots(page, `video-${n}`);
      await page.getByRole('button',{name:'重放本页',exact:true}).click();
      assert.equal(await page.locator('video').count(),0);
      check(`Original video P${n}`, JSON.stringify(data));
    }
    await page.getByRole('button',{name:'课件目录',exact:true}).click();
    assert.equal(await page.locator('.slide-catalog>button').count(),22);
    await page.keyboard.press('Escape');
    await page.locator('dialog').waitFor({state:'hidden'});
    check('Course catalog', '22 thumbnails; Escape closes modal');
  }
  if (phase === 'activities') {
    await go(16); await page.getByRole('button',{name:'听读词汇',exact:true}).click();
    assert.equal(await page.locator('.word-grid button').count(),13);
    await page.getByRole('button',{name:'harvest：收割（庄稼）',exact:true}).click();
    assert.equal(await page.locator('.word-focus>span').textContent(),'harvest');
    await shots(page,'04-word-activity'); await close();
    check('Vocabulary', '13 source words; selection, meaning and local pronunciation request');
    await go(17); await page.getByRole('button',{name:'完成填空',exact:true}).click();
    await page.getByRole('button',{name:'核对答案',exact:true}).click();
    assert.match(await page.locator('.cloze-actions [role=status]').textContent(), /0 \/ 8/);
    const answers=['shower','lazy','stream','shade','harvest','perfect','temperature','memories'];
    for(let i=0;i<answers.length;i++)await page.getByLabel(`文章第 ${i+1} 空`,{exact:true}).selectOption(answers[i]);
    await page.getByRole('button',{name:'核对答案',exact:true}).click();
    assert.match(await page.locator('.cloze-actions [role=status]').textContent(), /8 \/ 8/);
    await shots(page,'05-cloze-complete'); await close();
    await page.reload(); await frameReady(); await page.getByRole('button',{name:'完成填空',exact:true}).click();
    assert.equal(await page.getByLabel('文章第 8 空',{exact:true}).inputValue(),'memories'); await close();
    check('Cloze', 'Wrong answer feedback, all 8 correct answers and persisted selections');
    await go(19); await page.getByRole('button',{name:'录制我的导览',exact:true}).click();
    await page.locator('#audio-guide-script').fill('Spring arrives with rain and light.\nOur gardens wake, green and bright.');
    await page.getByRole('button',{name:'开始录音',exact:true}).click();
    await page.getByRole('button',{name:'结束录音',exact:true}).waitFor();
    await page.waitForFunction(()=>document.querySelector('.recording-time')?.textContent.includes('02'));
    await page.getByRole('button',{name:'结束录音',exact:true}).click();
    await page.locator('.recording-result audio').waitFor();
    const recording=await page.locator('.recording-result audio').evaluate(async audio=>{const response=await fetch(audio.src);const blob=await response.blob();return {bytes:blob.size,type:blob.type}});
    assert.ok(recording.bytes>500);
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('link',{name:'下载这段录音',exact:true}).click(); const download=await downloadPromise;
    assert.match(download.suggestedFilename(),/Spring.*webm/); assert.equal(await download.failure(),null);
    await shots(page,'06-recording-studio');
    check('Recording', `Fake microphone only: ${recording.bytes} bytes, ${recording.type}; playable result and download`);
    const textPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'下载四季文字稿',exact:true}).click(); const text=await textPromise;assert.equal(await text.failure(),null);
    await close(); await page.getByRole('button',{name:'录制我的导览',exact:true}).click();
    assert.match(await page.locator('#audio-guide-script').inputValue(),/Our gardens wake/);
    assert.equal(await page.locator('.recording-result audio').count(),1);
    await page.getByRole('button',{name:'重新录制',exact:true}).click();
    await page.getByRole('button',{name:'结束录音',exact:true}).waitFor();
    await page.evaluate(()=>location.hash='/lesson/20');
    await page.locator('dialog').waitFor({state:'hidden'});
    assert.equal(await page.getByRole('button',{name:'结束录音',exact:true}).count(),0);
    check('Recording lifecycle', 'Draft and recording survive reopening; browser route change closes activity and stops capture');
    await page.getByRole('button',{name:'写下我的思考与诗歌',exact:true}).click();
    await page.locator('#source-reflection').fill('Spring reminds me of new beginnings.');
    await page.locator('#source-homework').fill('Seasons turn and stories grow.');
    const homeworkPromise=page.waitForEvent('download');await page.getByRole('button',{name:'下载我的作品',exact:true}).click();assert.equal(await (await homeworkPromise).failure(),null);
    await close();check('Source homework','Editable reflection and poem; successful text export');
    await go(5);await page.getByRole('button',{name:'环顾冬日诗境',exact:true}).click();
    await page.locator('.scene-loading').waitFor({state:'hidden'});
    assert.equal(await page.locator('.panorama-fallback').count(),0);
    const hotspot=page.locator('.hotspot:visible').first(); await hotspot.waitFor();
    const before=await hotspot.getAttribute('style');
    await page.locator('[data-panorama]').focus();await page.keyboard.press('ArrowRight');
    await page.waitForFunction(before=>document.querySelector('.hotspot')?.getAttribute('style')!==before,before);
    await page.getByRole('button',{name:'重置场景视角',exact:true}).click();
    await page.locator('.hotspot:visible').first().click();
    assert.ok(await page.locator('.hotspot.is-found').count()>0);
    await page.getByRole('button',{name:'放大场景',exact:true}).click();
    await shots(page,'07-panorama'); await close();
    check('Optional panorama','WebGL scene loaded, view navigation, hotspot and zoom; no headset connected');
  }
  if(phase==='responsive') {
    for(const [width,height] of [[1440,900],[1024,768],[768,1024],[390,844],[375,812]]) {
      await page.setViewportSize({width,height});
      for(const n of [0,5,9,17,19]) {
        await page.evaluate(n=>location.hash=n?`/lesson/${n}`:'/',n);
        if(n)await frameReady();else await page.locator('.ppt-home').waitFor();
        if(n===17)await page.getByRole('button',{name:'完成填空',exact:true}).click();
        if(n===19)await page.getByRole('button',{name:'录制我的导览',exact:true}).click();
        const sizes=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,dialog:document.querySelector('dialog')?.getBoundingClientRect().width}));
        assert.ok(sizes.document<=width+1,JSON.stringify({width,n,sizes}));
        if(sizes.dialog)assert.ok(sizes.dialog<=width);
        if(width===390)await shots(page,`mobile-${n}`);
        if(n===17||n===19)await close();
      }
      check(`Responsive ${width}×${height}`,'Home, lesson, media, cloze and recording without page overflow');
    }
    await page.setViewportSize({width:390,height:844});await go(5);
    await page.getByRole('button',{name:'放大课件专注模式',exact:true}).click();
    const focus=await page.locator('.ppt-screen-area').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth,doc:document.documentElement.scrollWidth}));
    assert.ok(focus.scroll>focus.client && focus.doc<=390);
    await shots(page,'mobile-focus');await page.getByRole('button',{name:'退出课件专注模式',exact:true}).click();
    check('Mobile slide enlargement','Source slide enlarged inside horizontal view; page itself does not overflow');
    await page.evaluate(()=>{localStorage.setItem('seasons-source-steps-v3','{bad');localStorage.setItem('seasons-source-evidence-v3','[1]');localStorage.setItem('seasons-judy-follow-v3','{"bad":true}');});
    await page.reload();await frameReady('ppt-frames/05-00.webp');check('Damaged saved progress','Malformed saved data falls back to an operable lesson');
  }
  if(phase==='delivery') {
    await page.waitForFunction(()=>{const image=document.querySelector('.source-cover img');return image?.complete&&image.naturalWidth>0});
    await page.getByRole('button',{name:'进入 Autumn 原课件第 14 页',exact:true}).click();
    await frameReady('ppt-frames/14-00.webp');
    await page.getByRole('button',{name:'显示完整页',exact:true}).click();await frameReady('ppt-frames/14-11.webp');
    await page.getByRole('button',{name:'听朱迪讲这页',exact:true}).click();
    await page.waitForFunction(()=>Number(document.querySelector('.judy-3d-canvas')?.dataset.mouth || '0')>.1);
    await page.getByRole('button',{name:'全屏授课',exact:true}).click();
    assert.equal(await page.evaluate(()=>!!document.fullscreenElement),true);
    await page.getByRole('button',{name:'退出全屏',exact:true}).click();
    await go(9);await page.getByRole('button',{name:'播放原视频',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.3);
    check('Built delivery playback','Packaged slide, Judy audio, actual fullscreen and original video played through standalone server');
    await go(19);await page.getByRole('button',{name:'录制我的导览',exact:true}).click();
    await page.evaluate(()=>navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('QA permission rejection','NotAllowedError')});
    await page.getByRole('button',{name:'开始录音',exact:true}).click();
    await page.locator('.recorder-error').waitFor();
    assert.match(await page.locator('.recorder-error').textContent(),/麦克风未开启/);
    const rejectedText=page.waitForEvent('download');await page.getByRole('button',{name:'下载四季文字稿',exact:true}).click();assert.equal(await (await rejectedText).failure(),null);await close();
    check('Microphone rejection','Clear feedback; text editing and download remain usable');
    await go(5);await page.getByRole('button',{name:'环顾冬日诗境',exact:true}).click();
    await page.locator('.scene-loading').waitFor({state:'hidden'});assert.equal(await page.locator('.panorama-fallback').count(),0);await close();
    check('Lazy scene bundle','Optional panorama loads from packaged relative assets');
    const fallbackContext=await browser.newContext({viewport:{width:1280,height:900}});
    await fallbackContext.addInitScript(()=>{
      Object.defineProperty(window,'localStorage',{get(){throw new DOMException('QA storage rejection','SecurityError')}});
      const native=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:native.call(this,type,...args)};
    });
    const fallbackPage=await fallbackContext.newPage();await fallbackPage.goto(base+'#/lesson/5');
    await fallbackPage.getByRole('button',{name:'环顾冬日诗境',exact:true}).click();
    await fallbackPage.locator('.panorama-fallback').waitFor();
    await fallbackPage.getByRole('button',{name:'发现线索 snow',exact:true}).click();
    assert.ok(await fallbackPage.locator('.hotspot.is-found').count()>0);
    await fallbackContext.close();
    check('Unavailable WebGL and storage','Static scenery and clickable poem clues remain usable; lesson opens without persistent storage');
  }
  assert.deepEqual(errors,[],'Uncaught browser errors');assert.deepEqual(failedRequests,[],'HTTP failures');
  check('Browser health','No uncaught page errors or HTTP failures');
  fs.writeFileSync(path.join(out,`acceptance-${phase}.json`),JSON.stringify({date:new Date().toISOString(),base,browser:await browser.version(),source:manifest.source,sourceSha256:manifest.sha256,status:'passed',results,errors,failedRequests},null,2));
  await browser.close();
})().catch(async error=>{console.error(error);fs.writeFileSync(path.join(out,`acceptance-${phase}.json`),JSON.stringify({status:'failed',results,error:error.stack,errors,failedRequests},null,2));await browser?.close();process.exitCode=1});
