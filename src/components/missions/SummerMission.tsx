import { useRef, useState } from 'react';
import { ArrowRight, Check, RotateCcw, Shirt, Sparkles, Sun, ThermometerSun } from 'lucide-react';
import type { MissionProps } from '../../types';
import { CompletionPanel, MissionHeader, SpeakButton } from '../LearningUI';

type ClothId = 'tshirt' | 'shorts' | 'shoes' | 'jacket' | 'scarf' | 'gloves';

const CLOTHES: { id: ClothId; name: string; chinese: string; sentence: string }[] = [
  { id: 'tshirt', name: 'T-shirt', chinese: 'T 恤衫', sentence: 'a T-shirt' },
  { id: 'shorts', name: 'shorts', chinese: '短裤', sentence: 'shorts' },
  { id: 'shoes', name: 'shoes', chinese: '鞋子', sentence: 'shoes' },
  { id: 'jacket', name: 'jacket', chinese: '夹克衫', sentence: 'a jacket' },
  { id: 'scarf', name: 'scarf', chinese: '围巾', sentence: 'a scarf' },
  { id: 'gloves', name: 'gloves', chinese: '手套', sentence: 'gloves' },
];
const REQUIRED: ClothId[] = ['tshirt', 'shorts', 'shoes'];

function ClothIcon({ type }: { type: ClothId }) {
  const paths: Record<ClothId, React.ReactNode> = {
    tshirt: <><path d="m16 9-6-4a8 8 0 0 0 12 0l6 4 5 8-7 4v17H6V21l-7-4 5-8 6-4" /><path d="M10 5q2 6 6 6t6-6" fill="none" /></>,
    shorts: <><path d="M5 5h22l3 29-11 2-3-16-3 16-11-2L5 5Z" /><path d="M5 11h22M16 12v8" fill="none" /></>,
    shoes: <><path d="M3 23q8 2 11-11l7 3q-1 8 11 12v7H3v-11Z" /><path d="M18 20h5m-7 4h7" fill="none" /></>,
    jacket: <><path d="m12 5-8 5-3 20 8 2 2-13v19h18V19l2 13 8-2-3-20-8-5-6 7-6-7Z" /><path d="M16 12v26m-5-26 5 7 5-7" fill="none" /></>,
    scarf: <><path d="M7 7q9-7 18 0v9q-9 7-18 0V7Z" /><path d="m18 17 8 2-3 18-8-2 3-18Zm-7-1-3 17" /></>,
    gloves: <><path d="M6 20V9q0-3 3-3t3 3V5q0-3 3-3t3 3v4-6q0-3 3-3t3 3v7-4q0-3 3-3t3 3v12q0 12-9 16-12-2-15-14Z" /><path d="M9 22h18" fill="none" /></>,
  };
  return <svg viewBox="-4 -2 44 44" aria-hidden="true">{paths[type]}</svg>;
}

function DressUpFox({ selected }: { selected: ClothId[] }) {
  const has = (id: ClothId) => selected.includes(id);
  return (
    <svg className="dress-up-fox" viewBox="0 0 300 390" role="img" aria-label={`小伙伴当前穿着：${selected.length ? CLOTHES.filter((item) => selected.includes(item.id)).map((item) => item.chinese).join('、') : '尚未选择衣物'}`}>
      <ellipse cx="151" cy="367" rx="89" ry="14" fill="#a66a32" opacity=".14" />
      <path d="M207 245q82-30 57 54-12 38-67 20" fill="#cf743c" stroke="#6a4938" strokeWidth="4" />
      <path d="M253 274q24 20-4 45-13 9-30 5 27-19 34-50Z" fill="#fff0d7" />
      <path d="M107 253 96 344h41l13-91m23 0 5 91h41l-17-105" fill="#d9894e" stroke="#6a4938" strokeWidth="4" />
      <path d="M98 155q51-35 105 0l17 113q-67 39-132 0l10-113Z" fill="#d9894e" stroke="#6a4938" strokeWidth="4" />
      <path d="m104 165-38 75 25 11 37-63m72-23 35 75-25 11-34-63" fill="#d9894e" stroke="#6a4938" strokeWidth="4" strokeLinecap="round" />
      <path d="m98 64-4-47q29 4 43 38m62 9 4-47q-29 4-43 38" fill="#c97542" stroke="#6a4938" strokeWidth="4" />
      <path d="m104 47-2-20q14 5 23 23m72-3 2-20q-14 5-23 23" fill="#623f3b" />
      <ellipse cx="151" cy="112" rx="70" ry="67" fill="#dc884c" stroke="#6a4938" strokeWidth="4" />
      <path d="M92 119q10 58 59 61 49-3 60-61-22 25-41 5-10-9-19-30-9 21-19 30-19 20-40-5Z" fill="#fff0d7" />
      <ellipse cx="124" cy="99" rx="7" ry="10" fill="#37454a" />
      <ellipse cx="180" cy="99" rx="7" ry="10" fill="#37454a" />
      <circle cx="126" cy="96" r="2.5" fill="white" /><circle cx="182" cy="96" r="2.5" fill="white" />
      <path d="M141 127q10-9 20 0-2 13-10 13t-10-13Z" fill="#3d4142" />
      <path d="M151 140q-10 13-22 4m22-4q10 13 22 4" fill="none" stroke="#6a4938" strokeWidth="3" strokeLinecap="round" />
      {has('tshirt') && <><path d="m105 156 25-10q20 18 41 0l27 10 17 45-22 11-5-18 12 72q-47 27-96 0l12-72-7 18-21-11 17-45Z" fill="#f4f0dc" stroke="#385f67" strokeWidth="4" /><path d="M132 148q18 30 38 0" fill="none" stroke="#385f67" strokeWidth="4" /><circle cx="151" cy="209" r="18" fill="#efad3e" /><path d="M151 194v30m-15-15h30" stroke="#fff5d8" strokeWidth="4" /></>}
      {has('shorts') && <><path d="M103 254q47 18 98 0l8 61-43 4-14-35-11 35-44-4 6-61Z" fill="#5f9ec1" stroke="#385f67" strokeWidth="4" /><path d="M151 269v19" stroke="#385f67" strokeWidth="4" /></>}
      {has('jacket') && <><path d="m104 153 29-8 18 24 18-24 29 8 27 84-25 8-19-55 12 79-42 8-22-8 13-79-20 55-25-8 27-84Z" fill="#6b8c62" stroke="#3f553d" strokeWidth="4" /><path d="M151 170v101m-21-117 21 15 21-15" fill="none" stroke="#f1e7c9" strokeWidth="4" /></>}
      {has('scarf') && <><path d="M108 145q42 20 86 0l3 26q-46 24-92 0l3-26Z" fill="#d95f5c" stroke="#7c4040" strokeWidth="4" /><path d="m177 169 24 2 9 79-25 3-8-84Z" fill="#d95f5c" stroke="#7c4040" strokeWidth="4" /><path d="m188 235 18-2m-17 9 18-2" stroke="#f5c16a" strokeWidth="3" /></>}
      {has('gloves') && <><circle cx="76" cy="242" r="18" fill="#7185ae" stroke="#3f4d6d" strokeWidth="4" /><circle cx="225" cy="242" r="18" fill="#7185ae" stroke="#3f4d6d" strokeWidth="4" /></>}
      {has('shoes') && <><path d="M94 335q21-8 44 2l5 25q-38 16-67 0 2-19 18-27Zm76 2q23-10 43-2 17 8 20 27-30 16-67 0l4-25Z" fill="#f5f0dd" stroke="#385f67" strokeWidth="4" /><path d="M82 351h57m32 0h55" stroke="#efad3e" strokeWidth="5" /></>}
    </svg>
  );
}

export default function SummerMission({ onComplete, onBack, onNext, speak, playEffect }: MissionProps) {
  const [selected, setSelected] = useState<ClothId[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState('观察天气卡，选择合适的衣物，再检查穿搭。');
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [stars, setStars] = useState(0);
  const finishingRef = useRef(false);
  const sentence = `I wear ${REQUIRED.map((id) => CLOTHES.find((item) => item.id === id)!.sentence).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`;

  const toggle = (id: ClothId) => {
    if (solved) return;
    setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
    setFeedback('穿搭已更新。想一想：这件衣物适合炎热的夏天吗？');
  };

  const check = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const missing = REQUIRED.filter((id) => !selected.includes(id));
    const extra = selected.filter((id) => !REQUIRED.includes(id));
    if (missing.length === 0 && extra.length === 0) {
      setSolved(true);
      setFeedback('穿搭合适，表达也完整！这套衣服适合炎热的夏天。');
      playEffect('correct');
      speak(sentence);
    } else {
      playEffect('wrong');
      const extraNames = extra.map((id) => CLOTHES.find((item) => item.id === id)!.name);
      const missingNames = missing.map((id) => CLOTHES.find((item) => item.id === id)!.name);
      setMistakes((items) => [...items, ...extraNames, ...missingNames]);
      if (extra.length) setFeedback(`${extraNames.join('、')} 会让身体更热。炎热天气可以先脱下它们。`);
      else setFeedback(`还缺少 ${missingNames.join('、')}。看看衣物架，再补充完整。`);
    }
  };

  const finish = () => {
    if (finishingRef.current || !solved) return;
    finishingRef.current = true;
    const earned = attempts === 1 ? 3 : attempts === 2 ? 2 : 1;
    setStars(earned);
    onComplete({ stars: earned, mistakes, attempts, correct: 1 });
    setShowCompletion(true);
    playEffect('complete');
  };

  return (
    <main className="mission-page summer-page">
      <MissionHeader number="02" title="夏日清凉衣橱" english="SUMMER WARDROBE" description="观察天气 · 选择衣物 · 用英语说明穿搭理由" color="#df9132" icon={<Shirt />} onBack={onBack} />
      <div className="mission-workspace summer-workspace">
        <section className="wardrobe-scene">
          <div className="weather-card">
            <div><Sun size={38} /><span className="weather-temperature">35°</span></div>
            <div><span className="eyebrow">MISSION WEATHER</span><h3>It's hot and sunny.</h3><p>任务天气 · 晴朗炎热</p></div>
            <ThermometerSun size={28} />
          </div>
          <div className="dressing-room">
            <div className="dressing-room__light" />
            <DressUpFox selected={selected} />
            <div className="mirror-label"><Sparkles size={16} /><span>{solved ? 'Ready for summer!' : 'What do you wear?'}</span></div>
          </div>
          <div className={`outfit-sentence ${solved ? 'is-visible' : ''}`}>
            <div><span>试一试用英语说</span><strong>{solved ? sentence : 'I wear a … and … .'}</strong></div>
            <SpeakButton text={solved ? sentence : 'What do you wear in summer?'} speak={speak} compact />
          </div>
        </section>

        <section className="task-card wardrobe-task">
          <div className="task-card__topline"><span className="task-step">任务：为小伙伴准备夏日穿搭</span><span className="selection-count">已选 {selected.length} 件</span></div>
          <h2>What do you wear in summer?</h2>
          <p className="task-instruction">点击衣物试穿，再次点击可以脱下。</p>
          <div className="clothes-grid">
            {CLOTHES.map((cloth) => (
              <button key={cloth.id} className={`cloth-card ${selected.includes(cloth.id) ? 'is-selected' : ''}`} onClick={() => { toggle(cloth.id); speak(cloth.name); }} aria-pressed={selected.includes(cloth.id)} disabled={solved}>
                <span className="cloth-check"><Check size={14} /></span>
                <ClothIcon type={cloth.id} />
                <strong>{cloth.name}</strong><small>{cloth.chinese}</small>
                <span className="cloth-listen" aria-hidden="true">点选</span>
              </button>
            ))}
          </div>
          <div className={`adaptive-feedback ${solved ? 'is-success' : ''}`}><Sparkles size={18} /><span>{feedback}</span></div>
          <div className="task-actions">
            <button className="button button--ghost" disabled={solved} onClick={() => { setSelected([]); setFeedback('已清空衣架，重新搭配吧。'); }}><RotateCcw size={17} />重新搭配</button>
            {!solved ? <button className="button button--primary" disabled={!selected.length} onClick={check}><Check size={18} />检查穿搭</button>
              : <button className="button button--primary" onClick={finish}>完成挑战<ArrowRight size={18} /></button>}
          </div>
          <div className="sentence-hint"><Sun size={16} /><span>选择依据：It’s hot. 我们需要轻便、透气的衣物。</span></div>
        </section>
      </div>
      {showCompletion && <CompletionPanel stars={stars} message="你根据天气完成了合理穿搭，还能用 “I wear …” 介绍自己的选择。" mistakes={mistakes} onBack={onBack} onNext={onNext} />}
    </main>
  );
}
