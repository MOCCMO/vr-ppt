import { useRef, useState } from 'react';
import { ArrowRight, Check, CloudSun, Footprints, Grab, Leaf, Shirt, Sparkles } from 'lucide-react';
import type { MissionProps } from '../../types';
import { CompletionPanel, GuideAvatar, MissionHeader, SpeakButton } from '../LearningUI';

type Category = 'weather' | 'clothes' | 'actions';
interface Word { id: string; text: string; chinese: string; category: Category }
const WORDS: Word[] = [
  { id: 'cool', text: 'cool', chinese: '凉爽的', category: 'weather' },
  { id: 'cold', text: 'cold', chinese: '寒冷的', category: 'weather' },
  { id: 'jacket', text: 'jacket', chinese: '夹克衫', category: 'clothes' },
  { id: 'trousers', text: 'trousers', chinese: '长裤', category: 'clothes' },
  { id: 'fall', text: 'fall', chinese: '落下', category: 'actions' },
  { id: 'puton', text: 'put on', chinese: '穿上', category: 'actions' },
];
const CATEGORIES: { id: Category; title: string; english: string; icon: typeof CloudSun; color: string }[] = [
  { id: 'weather', title: '天气', english: 'WEATHER', icon: CloudSun, color: '#5c9db7' },
  { id: 'clothes', title: '衣物', english: 'CLOTHES', icon: Shirt, color: '#b16891' },
  { id: 'actions', title: '动作', english: 'ACTIONS', icon: Footprints, color: '#bc7444' },
];

export default function AutumnMission({ onComplete, onBack, onNext, speak, playEffect }: MissionProps) {
  const [placed, setPlaced] = useState<Partial<Record<string, Category>>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('拖动落叶到正确的篮子，也可以先点落叶、再点篮子。');
  const [solved, setSolved] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [stars, setStars] = useState(0);
  const finishingRef = useRef(false);
  const placedCount = Object.keys(placed).length;

  const placeWord = (id: string, category: Category) => {
    if (solved || placed[id]) return;
    const word = WORDS.find((item) => item.id === id);
    if (!word) {
      setSelectedId(null);
      setFeedback('请拖动本任务的落叶，或先点落叶、再点篮子。');
      playEffect('wrong');
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setSelectedId(null);
    if (word.category === category) {
      const nextPlaced = { ...placed, [id]: category };
      const nextCorrect = correct + 1;
      setPlaced(nextPlaced);
      setCorrect(nextCorrect);
      setFeedback(`分类正确！${word.text} 属于 ${CATEGORIES.find((item) => item.id === category)!.english.toLowerCase()}。`);
      playEffect('correct');
      if (Object.keys(nextPlaced).length === WORDS.length) {
        setSolved(true);
        setFeedback('所有落叶都回到了正确的位置，秋日词汇地图完成了！');
      }
    } else {
      setMistakes((items) => [...items, `${word.text}（${word.chinese}）`]);
      const hints: Record<Category, string> = {
        weather: '它描述的是天气感受吗？',
        clothes: '它是可以穿在身上的衣物吗？',
        actions: '它能表示一个动作吗？',
      };
      setFeedback(`${word.text} 还不属于这个篮子。${hints[word.category]}`);
      playEffect('wrong');
    }
  };

  const finish = () => {
    if (finishingRef.current || !solved) return;
    finishingRef.current = true;
    const earned = attempts <= 6 ? 3 : attempts <= 8 ? 2 : 1;
    setStars(earned);
    onComplete({ stars: earned, mistakes, attempts, correct });
    setShowCompletion(true);
    playEffect('complete');
  };

  return (
    <main className="mission-page autumn-page">
      <MissionHeader number="03" title="秋日落叶分类站" english="LEAF SORTING LAB" description="词义辨析 · 拖拽分类 · 建立词汇语义网络" color="#b96945" icon={<Leaf />} onBack={onBack} />
      <div className="mission-progress-line"><span style={{ width: `${(placedCount / WORDS.length) * 100}%` }} /></div>
      <div className="mission-workspace autumn-workspace">
        <section className="autumn-scene">
          <div className="autumn-illustration" aria-hidden="true">
            <svg viewBox="0 0 600 290">
              <circle cx="480" cy="58" r="38" fill="#f8cd72" opacity=".8" />
              <path d="M0 224q135-84 274-11t326-20v97H0v-66Z" fill="#dca56b" />
              <path d="M0 253q160-66 305-5t295-22v64H0v-37Z" fill="#bf7d50" />
              <path d="M270 246q20-105 5-183h42q-11 93 17 183h-64Z" fill="#76503b" />
              <path d="m293 141-77-60m87 17 76-59" stroke="#76503b" strokeWidth="16" strokeLinecap="round" />
              <g fill="#cf7048"><circle cx="213" cy="77" r="63" /><circle cx="300" cy="53" r="71" /><circle cx="380" cy="58" r="62" /></g>
              <g fill="#e7a14c"><circle cx="250" cy="46" r="42" /><circle cx="347" cy="83" r="47" /><circle cx="284" cy="111" r="48" /></g>
              <g fill="#f2c45d"><circle cx="218" cy="40" r="26" /><circle cx="390" cy="28" r="26" /><circle cx="326" cy="26" r="29" /></g>
              <g fill="#f5d372"><path d="m108 129 13-9 12 11-14 12-11-14Z" /><path d="m440 142 13-9 12 11-14 12-11-14Z" /><path d="m163 185 13-9 12 11-14 12-11-14Z" /></g>
            </svg>
          </div>
          <div className="autumn-guide"><GuideAvatar small color="#b96945" /><div><strong>小探的分类提示</strong><p>先想一想词义，再判断它属于哪一类。</p></div></div>
          <div className="leaf-tray" aria-label="待分类词汇">
            {WORDS.filter((word) => !placed[word.id]).map((word) => (
              <button
                key={word.id}
                className={`leaf-word ${selectedId === word.id ? 'is-selected' : ''}`}
                draggable
                onDragStart={(event) => { event.dataTransfer.setData('text/plain', word.id); event.dataTransfer.effectAllowed = 'move'; }}
                onClick={() => { setSelectedId(selectedId === word.id ? null : word.id); speak(word.text); }}
              >
                <Grab size={14} /><strong>{word.text}</strong><small>{word.chinese}</small>
              </button>
            ))}
            {placedCount === WORDS.length && <div className="tray-complete"><Check size={28} /><strong>落叶收集完成</strong></div>}
          </div>
        </section>

        <section className="task-card sorting-task">
          <div className="task-card__topline"><span className="task-step">已分类 {placedCount} / {WORDS.length}</span><SpeakButton text="cool, jacket, trousers, fall, put on" speak={speak} label="听词汇" /></div>
          <h2>拾起一片落叶，找到它的家。</h2>
          <p className="task-instruction">每个词语只有一个最匹配的类别。</p>
          <div className="sorting-baskets">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  className={`sorting-basket ${selectedId ? 'is-ready' : ''}`}
                  style={{ '--basket-color': category.color } as React.CSSProperties}
                  onClick={() => selectedId && placeWord(selectedId, category.id)}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
                  onDrop={(event) => { event.preventDefault(); placeWord(event.dataTransfer.getData('text/plain'), category.id); }}
                >
                  <span className="basket-icon"><Icon size={25} /></span>
                  <span className="basket-title"><strong>{category.title}</strong><small>{category.english}</small></span>
                  <span className="basket-words">
                    {WORDS.filter((word) => placed[word.id] === category.id).map((word) => <span key={word.id}>{word.text}<Check size={12} /></span>)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className={`adaptive-feedback ${solved ? 'is-success' : ''}`}><Sparkles size={18} /><span>{feedback}</span></div>
          <div className="task-actions">
            <span className="gesture-tip"><Grab size={16} />支持拖拽与点选</span>
            <button className="button button--primary" disabled={!solved} onClick={finish}>完成分类<ArrowRight size={18} /></button>
          </div>
        </section>
      </div>
      {showCompletion && <CompletionPanel stars={stars} message="你按词义建立了天气、衣物和动作三类词汇网络，分类迁移能力又进了一步。" mistakes={mistakes} onBack={onBack} onNext={onNext} />}
    </main>
  );
}
