import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Flower2, Lightbulb, RotateCcw, Send, Sparkles, Sun, Wind } from 'lucide-react';
import type { MissionProps } from '../../types';
import { CompletionPanel, GuideAvatar, MissionHeader, SpeakButton } from '../LearningUI';

interface Token { id: number; text: string }
interface Round {
  chinese: string;
  answer: string[];
  extra: string[];
  focus: string;
  hint: string;
}

const ROUNDS: Round[] = [
  { chinese: '春天，天气温暖。', answer: ['In', 'spring,', "it's", 'warm.'], extra: ['hot.', 'cold.'], focus: 'warm 与季节天气', hint: '先确定季节，再选择合适的天气。' },
  { chinese: '花儿开放。', answer: ['The', 'flowers', 'come', 'out.'], extra: ['fall', 'snow.'], focus: 'The flowers come out', hint: 'come out 在这里表示“开放”。' },
  { chinese: '我们可以放风筝。', answer: ['We', 'can', 'fly', 'a', 'kite.'], extra: ['go', 'swimming.'], focus: 'fly a kite 句型', hint: 'can 后面接动词原形。' },
];

function buildTokens(round: Round): Token[] {
  return [...round.answer, ...round.extra]
    .map((text, index) => ({ id: index, text }))
    .sort((a, b) => ((a.id * 7 + 3) % 11) - ((b.id * 7 + 3) % 11));
}

export default function SpringMission({ onComplete, onBack, onNext, speak, playEffect }: MissionProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState('点击词语组成句子，点击已选词语可以撤回。');
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const finishingRef = useRef(false);
  const round = ROUNDS[roundIndex];
  const tokens = useMemo(() => buildTokens(round), [round]);
  const selected = selectedIds.map((id) => tokens.find((token) => token.id === id)!).filter(Boolean);

  const selectToken = (id: number) => {
    if (solved || selectedIds.includes(id)) return;
    setSelectedIds((current) => [...current, id]);
    setFeedback('继续组句，注意句首大写和句末标点。');
  };

  const removeToken = (id: number) => {
    if (solved) return;
    setSelectedIds((current) => current.filter((item) => item !== id));
  };

  const reset = () => {
    setSelectedIds([]);
    setSolved(false);
    setFeedback('已清空，再听一遍句子试试看。');
  };

  const check = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const guess = selected.map((token) => token.text);
    const isCorrect = guess.length === round.answer.length && guess.every((word, index) => word === round.answer[index]);
    if (isCorrect) {
      setSolved(true);
      setCorrect((value) => value + 1);
      setFeedback('太棒了！词句准确，春日花园被点亮了。');
      playEffect('correct');
      speak(round.answer.join(' '));
      return;
    }
    playEffect('wrong');
    setMistakes((items) => [...items, round.focus]);
    const mismatch = guess.findIndex((word, index) => word !== round.answer[index]);
    if (mismatch === 0) {
      setFeedback(`句首再想一想：这句话以 “${round.answer[0]}” 开头。`);
    } else if (mismatch > 0 && mismatch < round.answer.length) {
      setFeedback(`第 ${mismatch + 1} 个位置需要调整。${round.hint}`);
    } else if (guess.length < round.answer.length) {
      setFeedback(`还差 ${round.answer.length - guess.length} 个词语。${round.hint}`);
    } else {
      setFeedback(`多选了 ${guess.length - round.answer.length} 个词语，点击已选的多余词块撤回。${round.hint}`);
    }
  };

  const next = () => {
    if (roundIndex < ROUNDS.length - 1) {
      setRoundIndex((value) => value + 1);
      setSelectedIds([]);
      setSolved(false);
      setFeedback('新的句子出现了，先听一听再组句。');
      return;
    }
    if (finishingRef.current) return;
    finishingRef.current = true;
    const stars = attempts <= 3 ? 3 : attempts <= 5 ? 2 : 1;
    setEarnedStars(stars);
    onComplete({ stars, mistakes, attempts, correct });
    setShowCompletion(true);
    playEffect('complete');
  };

  return (
    <main className="mission-page spring-page">
      <MissionHeader number="01" title="春日词句花园" english="SENTENCE GARDEN" description="听音辨义 · 组句表达 · 在语境中理解核心词句" color="#df7896" icon={<Flower2 />} onBack={onBack} />
      <div className="mission-progress-line"><span style={{ width: `${((roundIndex + (solved ? 1 : 0)) / ROUNDS.length) * 100}%` }} /></div>
      <div className="mission-workspace spring-workspace">
        <section className="garden-scene" aria-label="春日花园情境">
          <div className="scene-sky"><Sun size={48} /><span className="scene-cloud cloud-one" /><span className="scene-cloud cloud-two" /></div>
          <div className="kite"><span /><i /></div>
          <div className="garden-hill garden-hill--back" />
          <div className="garden-hill garden-hill--front" />
          <div className="garden-flowers" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <Flower2 key={index} />)}</div>
          <div className="garden-guide"><GuideAvatar color="#df7896" /><div><strong>小探的春日观察</strong><p>{round.chinese}</p></div></div>
          <div className="garden-vocabulary">
            <button onClick={() => speak('warm')}><Sun size={18} /><span><strong>warm</strong><small>温暖的</small></span></button>
            <button onClick={() => speak('flowers')}><Flower2 size={18} /><span><strong>flowers</strong><small>花朵</small></span></button>
            <button onClick={() => speak('fly a kite')}><Wind size={18} /><span><strong>fly a kite</strong><small>放风筝</small></span></button>
          </div>
        </section>

        <section className="task-card sentence-task">
          <div className="task-card__topline"><span className="task-step">句子 {roundIndex + 1} / {ROUNDS.length}</span><SpeakButton text={round.answer.join(' ')} speak={speak} label="听完整句子" /></div>
          <h2>{round.chinese}</h2>
          <p className="task-instruction">按正确语序点击词语，把句子送回春天。</p>
          <div className={`sentence-builder ${solved ? 'is-correct' : ''}`} aria-label="已选句子">
            {selected.length === 0 && <span className="sentence-placeholder">你的句子会出现在这里…</span>}
            {selected.map((token) => <button key={token.id} onClick={() => removeToken(token.id)}>{token.text}</button>)}
            {solved && <span className="sentence-check"><Check size={22} /></span>}
          </div>
          <div className="word-bank" aria-label="可选词语">
            {tokens.map((token) => <button key={token.id} disabled={selectedIds.includes(token.id) || solved} onClick={() => selectToken(token.id)}>{token.text}</button>)}
          </div>
          <div className={`adaptive-feedback ${solved ? 'is-success' : ''}`}><Sparkles size={18} /><span>{feedback}</span></div>
          <div className="task-actions">
            <button className="button button--ghost" onClick={reset} disabled={solved}><RotateCcw size={17} />清空</button>
            {!solved ? (
              <button className="button button--primary" onClick={check} disabled={selected.length === 0}><Check size={18} />检查句子</button>
            ) : (
              <button className="button button--primary" onClick={next}>{roundIndex === ROUNDS.length - 1 ? '完成任务' : '下一句'}<ArrowRight size={18} /></button>
            )}
          </div>
          <div className="sentence-hint"><Lightbulb size={16} /><span>句型支架：In spring, it’s … / We can …</span></div>
        </section>
      </div>
      {showCompletion && <CompletionPanel stars={earnedStars} message="你用三句准确的英文唤醒了春日花园，已经能把季节、天气和活动联系起来。" mistakes={mistakes} onBack={onBack} onNext={onNext} />}
      <button className="floating-next" onClick={onNext} title="教师自由演示：直接进入下一站"><Send size={17} />自由演示</button>
    </main>
  );
}
