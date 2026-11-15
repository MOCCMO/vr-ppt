import { useRef, useState } from 'react';
import { ArrowRight, AudioLines, Check, Ear, Snowflake, Sparkles, Waves } from 'lucide-react';
import type { MissionProps } from '../../types';
import { CompletionPanel, GuideAvatar, MissionHeader, SpeakButton } from '../LearningUI';

interface PhonicsWord {
  id: string;
  word: string;
  target: 'ea' | 'wh';
  answer: string;
  chinese: string;
  hint: string;
}
const WORDS: PhonicsWord[] = [
  { id: 'tea', word: 'tea', target: 'ea', answer: '/iː/', chinese: '茶', hint: 'tea 中的 ea 拉长声音：/iː/。' },
  { id: 'bread', word: 'bread', target: 'ea', answer: '/e/', chinese: '面包', hint: 'bread 中的 ea 短促有力：/e/。' },
  { id: 'teacher', word: 'teacher', target: 'ea', answer: '/iː/', chinese: '教师', hint: 'teacher 与 tea 的 ea 发音相同。' },
  { id: 'sweater', word: 'sweater', target: 'ea', answer: '/e/', chinese: '毛衣', hint: 'sweater 与 bread 的 ea 发音相同。' },
  { id: 'what', word: 'what', target: 'wh', answer: '/w/', chinese: '什么', hint: 'what 开头双唇收圆，发 /w/。' },
  { id: 'who', word: 'who', target: 'wh', answer: '/h/', chinese: '谁', hint: 'who 中 wh 发 /h/，就像轻轻呼气。' },
  { id: 'where', word: 'where', target: 'wh', answer: '/w/', chinese: '在哪里', hint: 'where 与 what 的 wh 发音相同。' },
  { id: 'whose', word: 'whose', target: 'wh', answer: '/h/', chinese: '谁的', hint: 'whose 与 who 的 wh 发音相同。' },
];

export default function WinterMission({ onComplete, onBack, onNext, speak, playEffect }: MissionProps) {
  const [index, setIndex] = useState(0);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [selectedSound, setSelectedSound] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('先听单词，再判断目标字母组合的发音。');
  const [showCompletion, setShowCompletion] = useState(false);
  const [stars, setStars] = useState(0);
  const finishingRef = useRef(false);
  const current = WORDS[index];
  const answered = solvedIds.includes(current.id);
  const allSolved = solvedIds.length === WORDS.length;
  const sounds = current.target === 'ea' ? ['/iː/', '/e/'] : ['/w/', '/h/'];

  const choose = (sound: string) => {
    if (answered) return;
    setSelectedSound(sound);
    setAttempts((value) => value + 1);
    if (sound === current.answer) {
      setSolvedIds((items) => [...items, current.id]);
      setFeedback(`正确！${current.word} 中的 ${current.target} 发 ${current.answer}。${current.hint}`);
      playEffect('correct');
      speak(current.word);
    } else {
      setMistakes((items) => [...items, `${current.word}: ${current.target}`]);
      setFeedback(`再听一次 “${current.word}”。注意 ${current.target} 的口型和声音长度，你可以再选一次。`);
      playEffect('wrong');
    }
  };

  const openWord = (nextIndex: number) => {
    const nextWord = WORDS[nextIndex];
    setIndex(nextIndex);
    setSelectedSound('');
    setFeedback(solvedIds.includes(nextWord.id)
      ? `${nextWord.word} 已点亮：${nextWord.target} 发 ${nextWord.answer}。`
      : '新的发音线索出现了，先听再判断。');
  };

  const next = () => {
    const later = WORDS.findIndex((word, wordIndex) => wordIndex > index && !solvedIds.includes(word.id));
    const first = WORDS.findIndex((word) => !solvedIds.includes(word.id));
    const nextIndex = later >= 0 ? later : first;
    if (nextIndex >= 0) openWord(nextIndex);
  };

  const finish = () => {
    if (finishingRef.current || !allSolved) return;
    finishingRef.current = true;
    const earned = attempts <= 8 ? 3 : attempts <= 11 ? 2 : 1;
    setStars(earned);
    onComplete({ stars: earned, mistakes, attempts, correct: solvedIds.length });
    setShowCompletion(true);
    playEffect('complete');
  };

  const renderWord = () => {
    const targetIndex = current.word.indexOf(current.target);
    return <>{current.word.slice(0, targetIndex)}<span>{current.target}</span>{current.word.slice(targetIndex + current.target.length)}</>;
  };

  return (
    <main className="mission-page winter-page">
      <MissionHeader number="04" title="冰雪发音实验室" english="PHONICS LAB" description="听音辨音 · 口型观察 · 发现字母组合的发音规律" color="#578fac" icon={<Snowflake />} onBack={onBack} />
      <div className="mission-progress-line"><span style={{ width: `${(solvedIds.length / WORDS.length) * 100}%` }} /></div>
      <div className="mission-workspace winter-workspace">
        <section className="phonics-scene">
          <div className="snow-dots" aria-hidden="true">{Array.from({ length: 18 }, (_, item) => <i key={item} />)}</div>
          <div className="phonics-orbit">
            <span className="orbit-ring orbit-ring--one" /><span className="orbit-ring orbit-ring--two" />
            <div className="phonics-letter">{current.target}</div>
            <AudioLines size={34} />
          </div>
          <div className="mouth-card">
            <span className="eyebrow">MOUTH LAB · 口型提示</span>
            {current.target === 'ea' ? (
              <div className="mouth-comparison"><div><span className="mouth mouth--long" /><strong>/iː/</strong><small>嘴角展开，声音拉长</small></div><div><span className="mouth mouth--short" /><strong>/e/</strong><small>口腔放松，声音短促</small></div></div>
            ) : (
              <div className="mouth-comparison"><div><span className="mouth mouth--round" /><strong>/w/</strong><small>双唇收圆，向前突出</small></div><div><span className="mouth mouth--open" /><strong>/h/</strong><small>嘴巴微张，轻轻呼气</small></div></div>
            )}
          </div>
          <div className="phonics-guide"><GuideAvatar small color="#578fac" /><div><strong>辨音小策略</strong><p>{current.target === 'ea' ? '找一位“发音朋友”：tea–teacher，bread–sweater。' : '把 who / whose 和 what / where 分组比较。'}</p></div></div>
        </section>

        <section className="task-card phonics-task">
          <div className="phonics-tabs" role="tablist" aria-label="字母组合">
            <button role="tab" aria-selected={current.target === 'ea'} className={current.target === 'ea' ? 'is-active' : ''} onClick={() => openWord(WORDS.findIndex((word) => word.target === 'ea' && !solvedIds.includes(word.id)) >= 0 ? WORDS.findIndex((word) => word.target === 'ea' && !solvedIds.includes(word.id)) : 0)}>ea 发音 <span>{WORDS.slice(0, 4).filter((word) => solvedIds.includes(word.id)).length}/4</span></button>
            <button role="tab" aria-selected={current.target === 'wh'} className={current.target === 'wh' ? 'is-active' : ''} onClick={() => openWord(WORDS.findIndex((word) => word.target === 'wh' && !solvedIds.includes(word.id)) >= 0 ? WORDS.findIndex((word) => word.target === 'wh' && !solvedIds.includes(word.id)) : 4)}>wh 发音 <span>{WORDS.slice(4).filter((word) => solvedIds.includes(word.id)).length}/4</span></button>
          </div>
          <div className="phonics-word-stage">
            <span className="task-step">听单词，选择 {current.target} 的发音</span>
            <div className="phonics-word">{renderWord()}</div>
            <span className="phonics-chinese">{current.chinese}</span>
            <SpeakButton text={current.word} speak={speak} label="播放单词" />
          </div>
          <div className="sound-options">
            {sounds.map((sound) => {
              const isCorrect = answered && sound === current.answer;
              const isWrong = selectedSound === sound && !answered && attempts > 0 && sound !== current.answer;
              return <button key={sound} disabled={answered} className={`${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''}`} onClick={() => choose(sound)}><Ear size={22} /><strong>{sound}</strong><span>{current.target === 'ea' ? (sound === '/iː/' ? '长音' : '短音') : (sound === '/w/' ? '圆唇音' : '呼气音')}</span>{isCorrect && <Check size={19} />}</button>;
            })}
          </div>
          <div className={`adaptive-feedback ${answered ? 'is-success' : ''}`}><Sparkles size={18} /><span>{feedback}</span></div>
          <div className="task-actions">
            <span className="gesture-tip"><Waves size={16} />已点亮 {solvedIds.length} / {WORDS.length} 个音素</span>
            {allSolved ? <button className="button button--primary" onClick={finish}>完成发音挑战<ArrowRight size={18} /></button>
              : <button className="button button--primary" disabled={!answered} onClick={next}>下一个单词<ArrowRight size={18} /></button>}
          </div>
        </section>
      </div>
      {showCompletion && <CompletionPanel stars={stars} message="你发现了 ea 与 wh 的两类发音规律，并能借助“发音朋友”迁移到新单词。" mistakes={mistakes} onBack={onBack} onNext={onNext} />}
    </main>
  );
}
