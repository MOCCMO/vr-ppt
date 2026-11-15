export interface AnswerAnalysis {
  season: string | null;
  weather: string[];
  clothes: string[];
  activities: string[];
  hasReason: boolean;
  hasExtension: boolean;
  fullSentence: boolean;
  consistencyIssue: string | null;
  stars: number;
  praise: string;
  suggestion: string;
}

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const WEATHER = ['warm', 'hot', 'cool', 'cold', 'sunny', 'windy', 'snowy'];
const CLOTHES = ['t-shirt', 't shirt', 'shorts', 'shoes', 'jacket', 'gloves', 'scarf', 'trousers', 'sweater', 'suit'];
const ACTIVITIES = ['fly a kite', 'go swimming', 'swimming', 'make a snowman', 'snowman', 'ski', 'flowers', 'leaves'];
const SEASON_WEATHER: Record<string, string[]> = {
  spring: ['warm', 'cool', 'sunny', 'windy'],
  summer: ['hot', 'warm', 'sunny'],
  autumn: ['cool', 'sunny', 'windy'],
  winter: ['cold', 'snowy', 'sunny', 'windy'],
};
const SEASON_ACTIVITIES: Record<string, string[]> = {
  spring: ['fly a kite', 'flowers'],
  summer: ['go swimming', 'swimming'],
  autumn: ['leaves'],
  winter: ['make a snowman', 'snowman', 'ski'],
};

function includesPhrase(text: string, phrase: string) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

export function analyzeSeasonAnswer(answer: string): AnswerAnalysis {
  const normalized = answer.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
  const season = SEASONS.find((item) => includesPhrase(normalized, item))
    ?? (/\bfall\b/.test(normalized) ? 'autumn' : null);
  const weather = WEATHER.filter((item) => includesPhrase(normalized, item));
  const clothes = CLOTHES.filter((item) => includesPhrase(normalized, item));
  const activities = ACTIVITIES.filter((item) => includesPhrase(normalized, item));
  const hasReason = /\bbecause\b|\bcause\b/.test(normalized) || weather.length > 0;
  const hasExtension = clothes.length > 0 || activities.length > 0;
  const wordCount = normalized.match(/[a-z]+(?:[-'][a-z]+)*/g)?.length ?? 0;
  const hasSentenceFrame = /\b(?:i\s+(?:really\s+)?(?:like|love|prefer|wear|can)|we\s+(?:like|love|wear|can)|it(?:'s|\s+is)|my\s+(?:favourite|favorite)\s+season\s+is)\b/.test(normalized);
  const fullSentence = hasSentenceFrame && /[.!?]$/.test(normalized) && wordCount >= 4;

  const mismatchedWeather = season ? weather.find((item) => !SEASON_WEATHER[season].includes(item)) : undefined;
  const mismatchedActivity = season ? activities.find((item) => !SEASON_ACTIVITIES[season].includes(item)) : undefined;
  let consistencyIssue: string | null = null;
  if (season && mismatchedWeather) {
    consistencyIssue = `在本课的 ${season} 情境中，请核对天气词 “${mismatchedWeather}”，换用更匹配的天气表达。`;
  } else if (season && mismatchedActivity) {
    consistencyIssue = `在本课的 ${season} 情境中，请核对活动 “${mismatchedActivity}”，换用更匹配的季节活动。`;
  }

  let stars = 0;
  if (season) {
    stars = 1;
    if (fullSentence && !consistencyIssue && (hasReason || hasExtension)) stars = 2;
    if (fullSentence && !consistencyIssue && hasReason && hasExtension) stars = 3;
  }

  let praise = '我已经收到你的回答。';
  if (season && consistencyIssue) praise = `你选择了 ${season} 并补充了细节，但有一处季节情境需要核对。`;
  else if (season && !fullSentence) praise = `你选出了 ${season} 和相关线索，再把它们连成完整句子。`;
  else if (stars === 3) praise = `表达完整且情境一致：你选择了 ${season}，还说出了理由与季节细节。`;
  else if (season && hasReason) praise = `你选择 ${season} 并说明了理由，季节与天气的联系表达得很清楚。`;
  else if (season && hasExtension) praise = `你不仅选择了 ${season}，还补充了衣物或活动，表达很具体。`;
  else if (season) praise = `你清楚地说出了最喜欢的季节：${season}。`;

  let suggestion = '先用 “I like spring / summer / autumn / winter best.” 告诉我你的选择。';
  if (consistencyIssue) suggestion = consistencyIssue;
  else if (season && !fullSentence) suggestion = '试着用 “I like … best.”、“It’s …” 和 “I can …” 连成句子，并在句末加上标点。';
  else if (season && !hasReason) suggestion = `再补充 “It's warm / hot / cool / cold.”，或用 because 说明你喜欢 ${season} 的理由。`;
  else if (season && !hasExtension) suggestion = '再加上 “I wear …” 或 “I can …”，介绍这个季节的穿搭或活动。';
  else if (stars === 3) suggestion = '可以试着不看句型支架再表达一次，让语言更自然、更自信。';

  return { season, weather, clothes, activities, hasReason, hasExtension, fullSentence, consistencyIssue, stars, praise, suggestion };
}
