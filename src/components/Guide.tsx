import { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Download, Headphones, Mic, Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { CLOZE_ANSWERS, CLOZE_PARAGRAPHS, CLOZE_WORDS, SEASONS, WORDS } from '../curriculum';
import { downloadText, isDrafts, useSaved } from '../lib';
import type { AudioController, Evidence, SeasonId } from '../types';
import type { RecorderController } from '../useRecorder';
import Dialog from './Dialog';

const WORD_EXAMPLES: Record<string, string> = { pool: 'Lazy afternoons by a pool.', crop: 'Farmers work to harvest crops.' };
const INITIAL_DRAFTS = Object.fromEntries(SEASONS.map(s => [s.id, s.guide.join('\n')])) as Record<SeasonId, string>;
const validCloze = (v: unknown): v is string[] => Array.isArray(v) && v.length === 8 && v.every(s => typeof s === 'string');
export default function Guide({ audio, recorder, evidence, onEvidence, onReflection, onSlides, initialStep = 0 }: { audio: AudioController; recorder: RecorderController; evidence: Evidence; onEvidence: (key: string) => void; onReflection: () => void; onSlides: (page: number) => void; initialStep?: number }) {
  const [step, setStep] = useState(initialStep);
  const [word, setWord] = useState<string | null>(null);
  const [cloze, setCloze] = useSaved('seasons-cloze-v2', Array<string>(8).fill(''), validCloze);
  const [checked, setChecked] = useState(false);
  const [drafts, setDrafts] = useSaved('seasons-guide-drafts-v2', INITIAL_DRAFTS, isDrafts);
  const [seasonId, setSeasonId] = useState<SeasonId>('spring');
  const [restore, setRestore] = useState(false);
  const [readingTips, setReadingTips] = useState(false);
  const season = SEASONS.find(s => s.id === seasonId)!;
  const recording = recorder.recordings[seasonId];
  const isRecording = recorder.recordingFor === seasonId;
  const score = cloze.filter((v, i) => v === CLOZE_ANSWERS[i]).length;
  const switchStep = (value: number) => { audio.stop(); recorder.stop(); setStep(value); };
  const switchSeason = (id: SeasonId) => { audio.stop(); recorder.stop(); setSeasonId(id); };
  const downloadGuide = () => { downloadText('My Four Seasons Audio Guide.txt', 'MY FOUR SEASONS AUDIO GUIDE\n\n' + ['spring', 'summer', 'autumn', 'winter'].map(id => `${id.toUpperCase()}\n${drafts[id as SeasonId]}`).join('\n\n')); onEvidence('guide-written'); };

  return <main className="guide-page">
    <header className="section-intro"><div><p className="section-index">DETECTIVE GUIDE <span>/</span> PPT 16–19</p><h1>Bring the seasons<br className="mobile-only" /> to life.</h1><p>收集词语，连成诗句，再用你的声音找回四季导览。</p></div><button className="text-button" onClick={() => onSlides(19)}>查看原课件 <ArrowRight size={16} /></button></header>
    <nav className="guide-steps" aria-label="导览制作步骤">{['Word clues', 'Complete the article', 'Your audio guide'].map((label, i) => <button key={label} onClick={() => switchStep(i)} className={step === i ? 'is-active' : ''} aria-current={step === i ? 'step' : undefined}><span>0{i + 1}</span><strong>{label}</strong><small>{['词汇线索', '语境运用', '录制导览'][i]}</small>{i === 1 && evidence['guide-cloze'] && <Check size={16} />}</button>)}</nav>
    {step === 0 && <section className="word-stage">
      <div className="word-stage-intro"><span className="large-outline">13</span><h2>A pocketful<br />of words.</h2><p>轻点单词，翻开词义。<br />再听一听它在英语里怎样发音。</p>{word && <div className="word-focus"><span>{word}</span><p>{WORDS.find(w => w[0] === word)?.[1]}</p>{WORD_EXAMPLES[word] && <p className="word-context-example" lang="en">{WORD_EXAMPLES[word]}</p>}<button className="text-button" onClick={() => audio.play(`word-${word}`)}><Volume2 size={17} />{WORD_EXAMPLES[word] ? '听课文例句' : '听发音'}</button></div>}</div>
      <div className="word-grid">{WORDS.map(([en, cn], i) => <button key={en} className={word === en ? 'is-active' : ''} onClick={() => { setWord(en); audio.play(`word-${en}`); }} aria-label={`${en}：${cn}`}><span className="word-index">{String(i + 1).padStart(2, '0')}</span><strong>{en}</strong><span className="word-meaning">{word === en ? cn : '点击查看'}</span><Volume2 size={15} /></button>)}</div>
      <div className="stage-bottom"><span>Clues of seasons · 原课件第 16 页</span><button className="button button--primary" onClick={() => switchStep(1)}>把词语放回情境 <ArrowRight size={17} /></button></div>
    </section>}
    {step === 1 && <section className="cloze-stage"><aside><h2>Millie’s<br />season notes.</h2><p>从词库选择词语，注意使用正确形式。</p><div className="cloze-bank">{CLOZE_WORDS.map(w => <span key={w}>{w}</span>)}</div><p className="quiet-note">Tip: memory 的形式可能需要变化。</p><button className="text-button" onClick={() => onSlides(17)}>原课件第 17 页 <ArrowRight size={15} /></button></aside><div className="article-paper">
      {CLOZE_PARAGRAPHS.map((paragraph, pi) => <p key={pi}>{paragraph.split(/(\{\d\})/g).map((part, j) => { const match = part.match(/^\{(\d)\}$/); if (!match) return <span key={j}>{part}</span>; const i = Number(match[1]); return <select key={j} aria-label={`文章第 ${i + 1} 空`} className={checked ? cloze[i] === CLOZE_ANSWERS[i] ? 'is-correct' : 'is-incorrect' : ''} value={cloze[i]} onChange={event => { const values = [...cloze]; values[i] = event.target.value; setCloze(values); setChecked(false); }}><option value="">{i + 1}. …</option>{[...CLOZE_WORDS, 'memories'].sort().map(w => <option key={w} value={w}>{w}</option>)}</select>; })}</p>)}
      <div className="cloze-actions"><button className="button button--primary" onClick={() => { setChecked(true); if (score === 8) onEvidence('guide-cloze'); }}>核对答案 <Check size={16} /></button>{checked && <span role="status" className={score === 8 ? 'correct-text' : 'retry-text'}>{score === 8 ? '8 / 8 · 词语都回到正确的位置了。' : `${score} / 8 · 再看看标出的空格。`}</span>}</div>
      {checked && score === 8 && <button className="text-button next-stage" onClick={() => switchStep(2)}>开始制作有声导览 <ArrowRight size={16} /></button>}
    </div></section>}
    {step === 2 && <section className="studio-stage">
      <div className="writing-desk"><header><div><span className="section-index">YOUR WORDS</span><h2>A Four Seasons<br />Audio Guide</h2></div><button className="icon-button" onClick={() => setRestore(true)} aria-label="恢复当前季节的课件示例" title="恢复课件示例"><RotateCcw size={18} /></button></header>
        <div className="studio-seasons" aria-label="选择导览季节">{['spring', 'summer', 'autumn', 'winter'].map(id => <button key={id} className={seasonId === id ? 'is-active' : ''} onClick={() => switchSeason(id as SeasonId)}>{SEASONS.find(s => s.id === id)!.name}{recorder.recordings[id as SeasonId] && <Check size={12} />}</button>)}</div>
        <label className="draft-label" htmlFor="audio-guide-script">从课件示例出发，写下你自己的 {season.name.toLowerCase()}。</label>
        <textarea id="audio-guide-script" className="guide-script" value={drafts[seasonId]} onChange={event => setDrafts({ ...drafts, [seasonId]: event.target.value })} spellCheck lang="en" maxLength={4000} />
        <div className="draft-status"><span><CheckCircle2 size={13} />文字稿自动保存在本浏览器</span><span>{drafts[seasonId].trim() ? drafts[seasonId].trim().split(/\s+/).length : 0} words</span></div>
        <div className="writing-desk-actions"><button className="button button--primary" onClick={downloadGuide}><Download size={16} />下载四季文字稿</button><button className="text-button" onClick={() => setReadingTips(v => !v)}>朗读提示 <Headphones size={16} /></button></div>
        {readingTips && <div className="reading-tips"><strong>Correctly · Clearly · Loudly · Vividly · Emotionally</strong><p>注意语音、语调、重读和停顿。让听众从你的声音里，看见四季的画面，感受到每个季节的心情。</p><button className="text-button" onClick={() => audio.play(season.id)}>听原诗这一节 <Volume2 size={15} /></button></div>}
      </div>
      <aside className="recording-desk"><span className="recording-label"><span />THE RECORDING ROOM</span><h2>Let your<br />voice travel.</h2><p>把文字读成一段有画面的声音。</p><div className={`recording-orb ${isRecording ? 'is-recording' : ''}`}><Mic size={38} strokeWidth={1.2} /><span /><span /></div><div className="recording-time">{String(Math.floor(recorder.seconds / 60)).padStart(2, '0')}<i>:</i>{String(recorder.seconds % 60).padStart(2, '0')}</div><span className="recording-season">{season.name} {isRecording ? '· 正在录音' : recorder.pending ? '· 等待麦克风权限' : '· 准备好就开始'}</span>
        <div className="recorder-buttons"><button className="record-button" disabled={recorder.pending} onClick={() => { if (isRecording) recorder.stop(); else { audio.stop(); void recorder.start(seasonId); } }}>{isRecording ? <><Square size={15} fill="currentColor" />结束录音</> : <><Mic size={16} />{recording ? '重新录制' : '开始录音'}</>}</button><button className="record-demo" disabled={isRecording || recorder.pending} onClick={() => audio.play(`guide-${seasonId}`)}>{audio.playing === `guide-${seasonId}` ? <Pause size={17} /> : <Play size={17} />}课件示例朗读</button></div>
        {recorder.pending && <button className="cancel-recording" onClick={recorder.stop}>取消等待</button>}
        {recorder.error && <p className="recorder-error" role="alert">{recorder.error}</p>}
        {recording && <div className="recording-result"><span><CheckCircle2 size={15} />你的 {season.name} · {recording.seconds}s</span><audio controls src={recording.url} aria-label={`${season.name} 我的录音`} onPlay={audio.stop} /><a href={recording.url} download={`${season.name}-my-audio-guide.${recording.extension}`} onClick={() => onEvidence(`recording-${seasonId}`)}><Download size={15} />下载这段录音</a></div>}
        <p className="recording-privacy">录音只留在当前页面，不上传。离开或刷新前请下载。每段最多 3 分钟。</p>
      </aside>
      <div className="stage-bottom"><span>读出韵律，也读出你眼中的四季。</span><button className="text-button" onClick={() => { audio.stop(); recorder.stop(); onReflection(); }}>走向诗的深处 <ArrowRight size={17} /></button></div>
    </section>}
    {audio.error && <p className="audio-notice" role="status">{audio.error}</p>}
    {restore && <Dialog title="恢复这一季的示例？" onClose={() => setRestore(false)}><p className="dialog-copy">这会替换当前的 {season.name} 文字稿。其他季节的文字稿和录音会保留。</p><div className="dialog-actions"><button className="button" onClick={() => setRestore(false)}>保留我的文字</button><button className="button button--primary" onClick={() => { setDrafts({ ...drafts, [seasonId]: INITIAL_DRAFTS[seasonId] }); setRestore(false); }}>恢复课件示例</button></div></Dialog>}
  </main>;
}
