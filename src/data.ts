import type { MissionId, Progress, SeasonId, SeasonMeta } from './types';

export const SEASONS: SeasonMeta[] = [
  {
    id: 'spring',
    name: '春',
    english: 'Spring',
    mission: '词句花园',
    missionEn: 'Sentence Garden',
    description: '唤醒春日词句，把温暖、花朵和风筝送回花园。',
    color: '#ed7e9b',
    softColor: '#fce6ed',
    weather: 'warm',
    sentence: "In spring, it's warm. The flowers come out.",
  },
  {
    id: 'summer',
    name: '夏',
    english: 'Summer',
    mission: '清凉衣橱',
    missionEn: 'Summer Wardrobe',
    description: '观察天气，为小伙伴搭一套合适的夏日服装。',
    color: '#ef9f38',
    softColor: '#fff0d9',
    weather: 'hot',
    sentence: 'In summer, it\'s hot. We can go swimming.',
  },
  {
    id: 'autumn',
    name: '秋',
    english: 'Autumn',
    mission: '落叶分类站',
    missionEn: 'Leaf Sorting Lab',
    description: '拾起落叶上的单词，按天气、衣物和动作分类。',
    color: '#cc7047',
    softColor: '#f8e9dd',
    weather: 'cool',
    sentence: "In autumn, it's cool. The leaves fall.",
  },
  {
    id: 'winter',
    name: '冬',
    english: 'Winter',
    mission: '冰雪发音站',
    missionEn: 'Phonics Lab',
    description: '点亮冰雪音素，分辨 ea 与 wh 的不同发音。',
    color: '#5b9fc6',
    softColor: '#e3f2fa',
    weather: 'cold',
    sentence: "In winter, it's cold. We can make a snowman.",
  },
];

export const MISSION_ORDER: MissionId[] = ['spring', 'summer', 'autumn', 'winter', 'final'];

export const seasonById = (id: SeasonId) => SEASONS.find((season) => season.id === id)!;

export const initialProgress = (): Progress => ({
  spring: { completed: false, stars: 0, mistakes: [], attempts: 0, correct: 0 },
  summer: { completed: false, stars: 0, mistakes: [], attempts: 0, correct: 0 },
  autumn: { completed: false, stars: 0, mistakes: [], attempts: 0, correct: 0 },
  winter: { completed: false, stars: 0, mistakes: [], attempts: 0, correct: 0 },
  final: { completed: false, stars: 0, mistakes: [], attempts: 0, correct: 0 },
});
