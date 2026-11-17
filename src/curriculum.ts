import type { Lens, Season } from './types';

export const LENSES: { id: Lens; name: string; chinese: string }[] = [
  { id: 'rhyme', name: 'Rhyme', chinese: '韵律' },
  { id: 'images', name: 'Images', chinese: '意象' },
  { id: 'language', name: 'Language', chinese: '语言' },
  { id: 'feeling', name: 'Feeling', chinese: '情感' },
];

// The supplied 22-slide deck is the content authority. The poem is transcribed
// from slide 18; the interpretation tasks follow slides 5–15.
export const SEASONS: Season[] = [
  {
    id: 'winter', name: 'Winter', chinese: '冬', subtitle: 'A quiet world, waiting for spring.', color: '#7398ae', pages: [5, 6], heading: 'Listen to winter.',
    poem: ['Winter days are full of snow,', 'When trees and flowers forget to grow,', 'And the birds fly far away.', 'To find a warm and sunny day.'],
    translations: ['冬日里白雪皑皑，', '树木和花朵仿佛忘了生长，', '鸟儿飞向远方，', '去寻找温暖晴朗的时光。'],
    pauses: ['Winter days / are full of snow,', 'When trees and flowers / forget to grow,', 'And the birds fly / far away.', 'To find / a warm and sunny day.'],
    rhymes: [{ word: 'snow', partner: 'grow' }, { word: 'away', partner: 'day' }],
    images: [
      { category: 'Weather · 天气', answer: 'snowy', choices: ['snowy', 'hot and sunny', 'windy and bright'] },
      { category: 'View · 景物', answer: 'trees and flowers forget to grow', choices: ['flowers everywhere', 'trees and flowers forget to grow', 'golden crops'] },
      { category: 'Activity · 活动', answer: 'birds fly far away', choices: ['farmers harvest crops', 'fly a kite', 'birds fly far away'] },
    ],
    language: { question: 'Why does the poet say “forget to grow”?', options: ['The plants have a bad memory.', 'It gives the plants a human action.', 'It tells us the plants have died.'], answer: 1, explanation: '“Forget” gives trees and flowers a human quality. This is personification（拟人）. Compared with “stop growing”, it makes the winter scene feel alive.' },
    feeling: { question: 'Which feeling best fits this winter scene?', options: ['Quiet and peaceful', 'Loud and busy', 'Hot and restless'], answer: 0, explanation: 'Snow, still plants and departing birds create a quiet, peaceful scene. This is one supported reading; use the poem to explain your own response.' },
    hotspots: [{ word: 'snow', translation: '白雪覆盖的冬日', line: 0, angle: -18, elevation: -10 }, { word: 'forget to grow', translation: '植物仿佛也在休息', line: 1, angle: 8, elevation: 8 }, { word: 'far away', translation: '鸟儿飞向温暖的地方', line: 2, angle: 23, elevation: 20 }],
    guide: ['The world is wearing coats of white,', 'And shining in the pale sunlight.', 'We build a snowman, tall and grand,', 'With a carrot nose and hat in hand.'],
  },
  {
    id: 'spring', name: 'Spring', chinese: '春', subtitle: 'Every little thing comes alive.', color: '#7f9b65', pages: [8, 9], heading: 'Step into spring.',
    poem: ['The days of spring are windy and bright,', 'A perfect time to fly a kite!', 'Bees and butterflies play among flowers,', 'Then hide from April showers.'],
    translations: ['春日明媚，微风轻扬，', '正是放飞风筝的好时光！', '蜜蜂和蝴蝶在花间嬉戏，', '又躲起身来，避开四月的阵雨。'],
    pauses: ['The days of spring / are windy and bright,', 'A perfect time / to fly a kite!', 'Bees and butterflies / play among flowers,', 'Then hide / from April showers.'],
    rhymes: [{ word: 'bright', partner: 'kite' }, { word: 'flowers', partner: 'showers' }],
    images: [
      { category: 'Weather · 天气', answer: 'windy and bright', choices: ['snowy', 'windy and bright', 'shorter days'] },
      { category: 'View · 景物', answer: 'bees, butterflies and flowers', choices: ['bees, butterflies and flowers', 'brown leaves', 'a frozen pool'] },
      { category: 'Activity · 活动', answer: 'fly a kite', choices: ['harvest crops', 'fly a kite', 'eat ice cream'] },
    ],
    language: { question: 'What do “play” and “hide” bring to the scene?', options: ['A cold and silent world', 'A list of scientific facts', 'A lively scene, like children playing'], answer: 2, explanation: '“Play” and “hide” make the bees and butterflies seem playful and lively. Watch the short film and notice how those actions create a picture in your mind.' },
    feeling: { question: 'Which feeling do these spring images suggest?', options: ['Tired and lonely', 'Excited and energetic', 'Still and empty'], answer: 1, explanation: 'Bright days, a flying kite, bees and butterflies suggest energy and excitement. Point to a word or line that gives you this feeling.' },
    hotspots: [{ word: 'bright', translation: '明媚的春日', line: 0, angle: 17, elevation: 18 }, { word: 'flowers', translation: '花间的蜂蝶', line: 2, angle: -16, elevation: -11 }, { word: 'a kite', translation: '放飞春天的风筝', line: 1, angle: 29, elevation: 8 }],
    guide: ['When soft spring showers fill the air,', 'We hold our kite and run with care.', 'Fresh flowers are seen everywhere.'],
  },
  {
    id: 'summer', name: 'Summer', chinese: '夏', subtitle: 'Slow down. Stay a little longer.', color: '#4a9896', pages: [11, 12], heading: 'Feel the summer.',
    poem: ['Those sweet memories of summer days', 'Are about quiet streams and trees and shade,', 'Lazy afternoons by a pool,', 'And eating ice cream to feel cool.'],
    translations: ['那些夏日里甜蜜的回忆，', '是静静的小溪、树木和浓荫，', '是池边悠闲的午后，', '是冰淇淋带来的清凉。'],
    pauses: ['Those sweet memories / of summer days', 'Are about quiet streams / and trees / and shade,', 'Lazy afternoons / by a pool,', 'And eating ice cream / to feel cool.'],
    rhymes: [{ word: 'days', partner: 'shade', note: '近韵：共同的 /eɪ/ 元音，词尾辅音不同。' }, { word: 'pool', partner: 'cool' }],
    images: [
      { category: 'Pace · 节奏', answer: 'lazy afternoons', choices: ['busy mornings', 'lazy afternoons', 'a snowy night'] },
      { category: 'View · 景物', answer: 'streams, trees, shade and a pool', choices: ['brown leaves', 'streams, trees, shade and a pool', 'snowy fields'] },
      { category: 'Activity · 活动', answer: 'eat ice cream and enjoy the shade', choices: ['fly far away', 'harvest crops', 'eat ice cream and enjoy the shade'] },
    ],
    language: { question: 'What does “lazy” mean in “lazy afternoons”?', options: ['Slow, relaxed and unhurried', 'Always refusing to do homework', 'Unable to remember anything'], answer: 0, explanation: 'Here “lazy” describes a pleasantly relaxed pace. Compare it with “Tom is lazy. He never does his homework.” The context changes its feeling.' },
    feeling: { question: 'How do these summer memories feel?', options: ['Anxious and frightened', 'Angry and restless', 'Sweet, relaxed and comfortable'], answer: 2, explanation: '“Sweet memories”, quiet streams, shade and ice cream suggest comfort and relaxation. The poem describes a remembered summer.' },
    hotspots: [{ word: 'streams', translation: '静静流淌的小溪', line: 1, angle: -18, elevation: -12 }, { word: 'shade', translation: '树荫里的清凉', line: 1, angle: 13, elevation: 12 }, { word: 'a pool', translation: '池边悠闲的午后', line: 2, angle: 27, elevation: -4 }],
    guide: ['The golden sun is high and bright,', 'It fills the world with warm light.', 'Beside the cool pool we stay,', 'We find soft shade to pass the day.'],
  },
  {
    id: 'autumn', name: 'Autumn', chinese: '秋', subtitle: 'Every ending holds a beginning.', color: '#bd793e', pages: [14, 15], heading: 'Follow the autumn.',
    poem: ['Then autumn leaves turn brown,', 'Fall into piles upon the ground.', 'Farmers work to harvest crops,', 'As the days get shorter and the temperature drops.', 'Soon the snowy season will begin,', 'And it will be a new year once again.'],
    translations: ['秋天的树叶渐渐变褐，', '纷纷落地，堆积成叠。', '农民忙着收割庄稼，', '白昼渐短，气温也随之下降。', '很快，雪季将再次到来，', '又将迎来崭新的一年。'],
    pauses: ['Then autumn leaves / turn brown,', 'Fall into piles / upon the ground.', 'Farmers work / to harvest crops,', 'As the days get shorter / and the temperature drops.', 'Soon the snowy season / will begin,', 'And it will be a new year / once again.'],
    rhymes: [{ word: 'brown', partner: 'ground', note: '近韵：/aʊn/ 与 /aʊnd/，ground 多一个词尾 /d/。' }, { word: 'crops', partner: 'drops' }, { word: 'begin', partner: 'again', note: '听词尾的呼应；again 有不同读音，不把这个配对当作严格的完全押韵。' }],
    images: [
      { category: 'Weather · 天气', answer: 'shorter days and dropping temperatures', choices: ['shorter days and dropping temperatures', 'April showers', 'long hot days'] },
      { category: 'View · 景物', answer: 'brown leaves in piles', choices: ['pink flowers', 'brown leaves in piles', 'snow-covered trees'] },
      { category: 'Activity · 活动', answer: 'farmers harvest crops', choices: ['fly a kite', 'eat ice cream', 'farmers harvest crops'] },
    ],
    language: { question: 'What does “as” mean in this line of the poem?', options: ['Because · 因为', 'When / while · 当……时，随着', 'On top of · 在……上'], answer: 1, explanation: '“As the days get shorter…” describes changes happening together. Compare “As it is cold outside, we stay at home”, where “as” gives a reason. “Upon” in the previous line means “on”.' },
    feeling: { question: 'Which reading includes both the ending and the new year?', options: ['Only sadness, with no hope', 'Nothing ever changes', 'A little sadness, satisfaction and hope'], answer: 2, explanation: 'Falling leaves suggest an ending; harvesting suggests satisfaction; “a new year once again” opens up hope. These are possible interpretations supported by different lines.' },
    hotspots: [{ word: 'piles', translation: '落叶堆积在地上', line: 1, angle: -19, elevation: -12 }, { word: 'harvest crops', translation: '收获田野里的庄稼', line: 2, angle: 19, elevation: -4 }, { word: 'once again', translation: '四季流转，新年将至', line: 5, angle: 2, elevation: 18 }],
    guide: ['As farmers harvest every crop,', 'We watch brown leaves gently drop.', 'Warm autumn joys never stop.'],
  },
];

export const WORDS = [
  ['hide', '躲避；藏'], ['shower', '阵雨'], ['memory', '回忆'], ['stream', '小河；溪'], ['shade', '树荫'], ['lazy', '慵懒的；懒惰的'], ['temperature', '温度'],
  ['pool', '水塘；池塘'], ['pile', '堆'], ['upon', '在……上'], ['harvest', '收割（庄稼）'], ['crop', '庄稼；作物'], ['as', '当……时，随着；因为'],
];
export const CLOZE_WORDS = ['harvest', 'lazy', 'memory', 'perfect', 'shade', 'shower', 'stream', 'temperature'];
export const CLOZE_ANSWERS = ['shower', 'lazy', 'stream', 'shade', 'harvest', 'perfect', 'temperature', 'memories'];
export const CLOZE_PARAGRAPHS = [
  'The weather in spring is often warm, but sometimes it is windy and rainy. Spring rain doesn’t usually last long, so we call it a {0}. When it rains, I enjoy spending a {1} afternoon on the sofa and reading my favourite books.',
  'Summer is my favourite season. I like to play on the grass beside the {2} with my friends and sit under the {3} of trees. Summer is also a great time for ice cream!',
  'When autumn comes, it is time to {4}. The farmers are busy with their crops in the fields. The weather is {5} at this time of year. I love to go for a picnic with my family on sunny days.',
  'In winter, it is often very cold, and the {6} can drop below zero. Sometimes white snow covers the ground. I have wonderful {7} of making snowmen with my friends.',
];
export const SLIDE_TITLES = [
  'Seasons of the year', 'The missing audio guide', 'Match the seasons', 'The season route', 'Winter · Rhyme & images', 'Winter · Language & feeling', 'The season route',
  'Spring · Rhyme & images', 'Spring · Language & feeling', 'The season route', 'Summer · Rhyme & images', 'Summer · Language & feeling', 'The season route',
  'Autumn · Rhyme & images', 'Autumn · Language & feeling', 'Clues of seasons', 'Complete Millie’s article', 'Read the poem', 'A Four Seasons Audio Guide', 'Why begin with winter?', 'Further thinking', 'Enjoy the seasons · Homework',
];
