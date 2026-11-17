import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Check, Compass, Download, Grid2X2, Maximize, Minimize, Volume2, VolumeX, X } from 'lucide-react';
import { SEASONS, SLIDE_TITLES } from './curriculum';
import manifest from './ppt-manifest.json';
import { asset, downloadText, isEvidence, isString, useLessonAudio, useSaved } from './lib';
import type { Evidence, SeasonId } from './types';
import useRecorder from './useRecorder';
import PPTHome from './components/PPTHome';
import PPTClassroom from './components/PPTClassroom';
import Guide from './components/Guide';
import Dialog from './components/Dialog';
import CoverPatch from './components/CoverPatch';
import './ppt.css';
const Panorama = lazy(() => import('./components/Panorama'));

function parseRoute() {
  const match = window.location.hash.match(/^#\/lesson\/(\d+)$/);
  return match ? { home: false, page: Math.max(1, Math.min(22, Number(match[1]))) } : { home: true, page: 1 };
}
const validBool = (v: unknown): v is boolean => typeof v === 'boolean';

export default function App() {
  const [route, setRoute] = useState(parseRoute);
  // Answer reveals belong to the current presentation, never a previous visit.
  const [step, updateStep] = useState(0);
  const [evidence, setEvidence] = useSaved<Evidence>('seasons-source-evidence-v3', {}, isEvidence);
  const [follow, setFollow] = useSaved('seasons-judy-follow-v3', false, validBool);
  const [sound, setSound] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [notice, setNotice] = useState('');
  const [catalog, setCatalog] = useState(false);
  const [about, setAbout] = useState(false);
  const [activity, setActivity] = useState<number | null>(null);
  const [explore, setExplore] = useState<SeasonId | null>(null);
  const [reset, setReset] = useState(false);
  const [poem, setPoem] = useSaved('seasons-my-poem-v2', '', isString);
  const [thoughts, setThoughts] = useSaved('seasons-thoughts-v2', '', isString);
  const audio = useLessonAudio(sound);
  const recorder = useRecorder();
  const page = route.page;
  const setStep = useCallback((value: number) => updateStep(Math.max(0, Math.min(value, manifest.slides[page - 1].frames.length - 1))), [page]);
  const onEvidence = useCallback((key: string) => setEvidence(prev => prev[key] ? prev : { ...prev, [key]: true }), [setEvidence]);
  const toPage = useCallback((next: number) => {
    audio.stop(); recorder.stop(); setCatalog(false); setActivity(null); setExplore(null); setNotice('');
    const value = Math.max(1, Math.min(22, next)); updateStep(0); window.location.hash = `/lesson/${value}`; setRoute({ home: false, page: value }); window.scrollTo({ top: 0 });
  }, [audio.stop, recorder.stop]);
  const toHome = useCallback(() => { audio.stop(); recorder.stop(); setFocused(false); window.location.hash = '/'; setRoute({ home: true, page: 1 }); window.scrollTo({ top: 0 }); }, [audio.stop, recorder.stop]);
  const next = useCallback(() => { if (step < manifest.slides[page - 1].frames.length - 1) setStep(step + 1); else if (page < 22) toPage(page + 1); else toHome(); }, [page, step, setStep, toPage, toHome]);
  const previous = useCallback(() => {
    if (step > 0) setStep(step - 1);
    else if (page > 1) toPage(page - 1);
  }, [step, page, setStep, toPage]);
  useEffect(() => {
    const update = () => {
      const nextRoute = parseRoute();
      recorder.stop(); updateStep(0); setRoute(nextRoute); setCatalog(false); setActivity(null); setExplore(null);
      if (nextRoute.home) setFocused(false);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, [recorder.stop]);
  useEffect(() => { audio.stop(); if (!route.home && follow && sound) audio.play(`judy-${String(page).padStart(2, '0')}`); }, [page, route.home, follow, sound, audio.play, audio.stop]);
  useEffect(() => { if (!route.home) onEvidence(`slide-${page}`); document.title = `${route.home ? '' : `P${page} · `}Seasons of the year · 朱迪的四季课堂`; }, [page, route.home, onEvidence]);
  useEffect(() => { const update = () => setFullscreen(!!document.fullscreenElement); document.addEventListener('fullscreenchange', update); return () => document.removeEventListener('fullscreenchange', update); }, []);
  const toggleFullscreen = useCallback(async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { setNotice('当前浏览器未开启全屏，可继续在窗口中授课。'); } }, []);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const element = event.target;
      if (event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]') || (element instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT', 'VIDEO', 'AUDIO'].includes(element.tagName) || element.isContentEditable))) return;
      if (event.repeat && ['ArrowRight', 'ArrowLeft', ' ', 'Enter', 'PageDown', 'PageUp'].includes(event.key)) { event.preventDefault(); return; }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); void toggleFullscreen(); }
      if (route.home) return;
      if (event.key === 'ArrowRight' || (event.key === ' ' && !(element instanceof HTMLButtonElement))) { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
      if (event.key === 'PageDown') { event.preventDefault(); toPage(Math.min(page + 1, 22)); }
      if (event.key === 'PageUp') { event.preventDefault(); toPage(Math.max(page - 1, 1)); }
      if (event.key === 'Escape' && focused) setFocused(false);
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [route.home, next, previous, page, focused, toggleFullscreen, toPage]);
  const openActivity = (value: number) => { audio.stop(); setActivity(value); };
  const closeActivity = () => { audio.stop(); recorder.stop(); setActivity(null); };
  const seen = Array.from({ length: 22 }, (_, i) => i + 1).filter(i => evidence[`slide-${i}`]).length;
  return <div className={`ppt-app ${focused && !route.home ? 'ppt-app--focused' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>跳到课件</a>
    <header className="ppt-header"><button className="brand" onClick={toHome} aria-label="Seasons 课程首页"><Compass size={34} strokeWidth={1.1} /><span>SEASONS<small>朱 迪 的 四 季 课 堂</small></span></button><nav aria-label="课程导航"><button onClick={() => toPage(4)} className={!route.home && page >= 4 && page <= 15 ? 'is-active' : ''}>四季旅程</button><button onClick={() => toPage(16)} className={!route.home && page >= 16 && page <= 19 ? 'is-active' : ''}>诗歌导览</button><button onClick={() => toPage(20)} className={!route.home && page >= 20 ? 'is-active' : ''}>思考与作业</button></nav><div className="ppt-header-actions"><button className="icon-button" onClick={() => setSound(v => !v)} aria-label={sound ? '关闭声音' : '开启声音'} title="声音">{sound ? <Volume2 size={19} /> : <VolumeX size={19} />}</button><button className="icon-button" onClick={toggleFullscreen} aria-label={fullscreen ? '退出全屏' : '全屏授课'} title="全屏授课（F）">{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button><button className="icon-button" onClick={() => setCatalog(true)} aria-label="课件目录" title="22 页课件目录"><Grid2X2 size={18} /></button><button className="icon-button about-button" onClick={() => setAbout(true)} aria-label="使用说明" title="使用说明"><BookOpen size={18} /></button></div></header>
    {notice && <p className="app-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="关闭提示"><X size={14} /></button></p>}
    <div id="main-content" tabIndex={-1}>
      {route.home ? <PPTHome onPage={toPage} audio={audio} follow={follow} onFollow={setFollow} /> : <PPTClassroom page={page} step={step} onStep={setStep} onPage={toPage} onHome={toHome} onNext={next} onPrevious={previous} onContents={() => setCatalog(true)} audio={audio} sound={sound} follow={follow} onFollow={setFollow} focused={focused} onFocus={() => setFocused(v => !v)} onActivity={openActivity} onExplore={id => { audio.stop(); setExplore(id); }} />}
    </div>
    {catalog && <Dialog title="原课件目录 · 22 页" wide onClose={() => setCatalog(false)}><div className="catalog-summary"><span>11.17 seasons-1.pptx</span><span>本浏览器已浏览 {seen} / 22 页</span></div><div className="slide-catalog">{manifest.slides.map((s, i) => <button className={!route.home && page === i + 1 ? 'is-active' : ''} key={s.page} onClick={() => toPage(s.page)}><img src={asset(s.frames[0])} alt="" loading="lazy" />{s.page === 1 && <CoverPatch />}<span><b>{String(s.page).padStart(2, '0')}</b>{SLIDE_TITLES[i]}{evidence[`slide-${s.page}`] && <Check size={12} />}</span></button>)}</div><div className="catalog-footer">{reset ? <><span>重置本次翻页进度？文字稿与录音会保留。</span><button className="text-button" onClick={() => { updateStep(0); setEvidence({}); setReset(false); toPage(1); }}>确认开始新课 <ArrowRight size={14} /></button><button className="text-button" onClick={() => setReset(false)}>取消</button></> : <button className="text-button" onClick={() => setReset(true)}>从头开始一堂新课 <ArrowRight size={14} /></button>}</div></Dialog>}
    {about && <Dialog title="使用说明" onClose={() => setAbout(false)}><div className="ppt-help"><h3>一页一页，跟着原课件走。</h3><p>本网页以 <strong>11.17 seasons-1.pptx</strong> 为唯一依据。保留 22 页的原有顺序、版面和素材；四季路线为冬、春、夏、秋。</p><p>点击画面或按 <kbd>→</kbd> / 空格，按课件的显现顺序继续；<kbd>←</kbd> 回退；Page Down / Page Up 直接翻页；<kbd>F</kbd> 全屏。</p><p>朱迪以全身 3D 模型陪你上课，可拖动转身查看。点击她即可听当前页英语提示，嘴型会随语音变化，也可勾选自动跟随翻页。</p><p>春、秋短片直接来自这份课件。词汇、填空和录音入口在第 16–19 页，课堂任务均能在普通网页内完成。</p><p>“下一步”保留原对象的显现和退出顺序；飞入、旋转等特效采用网页淡入与逐步展示。地图自动尺寸文本框做了防断行处理，原 PPT 文件没有修改。</p><p>每次进入或刷新课件页，答案都会重新隐藏，点击一次仅继续一步；已浏览记录和文字稿保存在本浏览器；录音只在当前页面保留，请在刷新或离开前下载。录音不上传。</p><p>“环顾诗境”为可选的 360° 场景，头显入口仅在支持设备上显示；原课件始终是教学主线。</p></div></Dialog>}
    {activity !== null && <Dialog title={activity === 0 ? 'Clues of seasons · 词汇听读' : activity === 1 ? 'Millie’s article · 课件填空' : activity === 2 ? 'A Four Seasons Audio Guide · 录制导览' : 'My seasons poem · 我的四季诗'} wide onClose={closeActivity}>{activity < 3 ? <Guide key={activity} initialStep={activity} audio={audio} recorder={recorder} evidence={evidence} onEvidence={onEvidence} onReflection={() => toPage(20)} onSlides={toPage} /> : <div className="homework-dialog"><label htmlFor="source-reflection">Which season may stand for your age?</label><textarea id="source-reflection" value={thoughts} onChange={event => setThoughts(event.target.value)} placeholder="选择一个季节，写下你的理由。" maxLength={3000} /><label htmlFor="source-homework">Create a whole poem about seasons.</label><textarea id="source-homework" value={poem} onChange={event => setPoem(event.target.value)} placeholder="My seasons poem…" maxLength={8000} /><p>Must do：创作完整的四季诗。Choose to do：把一首喜爱的诗译成英语。</p><button className="button button--primary" onClick={() => downloadText('My seasons poem.txt', `MY REFLECTION\n${thoughts}\n\nMY SEASONS POEM\n${poem}`)}><Download size={16} />下载我的作品</button></div>}</Dialog>}
    {explore && <Dialog title={`${SEASONS.find(s => s.id === explore)!.name} · 环顾四季诗境`} wide onClose={() => { audio.stop(); setExplore(null); }}><div className="explore-dialog"><Suspense fallback={<p>正在打开场景…</p>}><Panorama season={SEASONS.find(s => s.id === explore)!} expanded found={evidence} onClue={i => { const season = SEASONS.find(s => s.id === explore)!; audio.play(`${season.id}-${season.hotspots[i].line}`); onEvidence(`${season.id}-spot-${i}`); }} /></Suspense></div><p className="media-caption">拖动环顾，点击光点听对应诗句。关闭窗口，继续原课件。</p></Dialog>}
  </div>;
}
