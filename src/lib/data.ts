/**
 * [INPUT]: None (no external dependencies)
 * [OUTPUT]: All type definitions + constants + characters/scenes/items/chapters/events/endings + utility functions
 * [POS]: lib UI thin layer, consumed by store.ts and all components. Narrative content lives in script.md
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

// ── Types ──

export interface TimePeriod {
  index: number
  name: string
  icon: string
  hours: string
}

export interface StatMeta {
  key: string
  label: string
  color: string
  icon: string
  category: 'relation' | 'status' | 'skill'
}

export type CharacterStats = Record<string, number>

export interface Character {
  id: string
  name: string
  portrait: string
  gender: 'female' | 'male'
  age: number
  title: string
  description: string
  personality: string
  speakingStyle: string
  secret: string
  triggerPoints: string[]
  behaviorPatterns: string
  themeColor: string
  joinDay: number
  statMetas: StatMeta[]
  initialStats: CharacterStats
}

export interface Scene {
  id: string
  name: string
  icon: string
  description: string
  background: string
  atmosphere: string
  tags: string[]
  unlockCondition?: {
    day?: number
    stat?: { charId: string; key: string; min: number }
  }
}

export interface GameItem {
  id: string
  name: string
  icon: string
  type: 'tool' | 'clue' | 'gift'
  description: string
  maxCount?: number
}

export interface Chapter {
  id: number
  name: string
  dayRange: [number, number]
  description: string
  objectives: string[]
  atmosphere: string
}

export interface ForcedEvent {
  id: string
  name: string
  triggerDay: number
  triggerPeriod?: number
  description: string
}

export interface Ending {
  id: string
  name: string
  type: 'TE' | 'HE' | 'NE' | 'BE'
  description: string
  condition: string
}

export interface StoryRecord {
  id: string
  day: number
  period: string
  title: string
  content: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  character?: string
  timestamp: number
  type?: 'scene-transition' | 'day-change' | 'clue-found'
  sceneId?: string
  dayInfo?: { day: number; chapter: string }
}

// ── Constants ──

export const PERIODS: TimePeriod[] = [
  { index: 0, name: '早晨', icon: '🌅', hours: '6:00-12:00' },
  { index: 1, name: '午后', icon: '☀️', hours: '12:00-18:00' },
  { index: 2, name: '夜晚', icon: '🌙', hours: '18:00-24:00' },
]

export const MAX_DAYS = 30
export const MAX_ACTION_POINTS = 3

// ── Player StatMeta (Global) ──

export const PLAYER_STAT_METAS: StatMeta[] = [
  { key: 'stamina', label: '体力', color: '#22c55e', icon: '💪', category: 'status' },
  { key: 'mental', label: '心理', color: '#a78bfa', icon: '🧠', category: 'status' },
  { key: 'alertness', label: '警觉', color: '#3b82f6', icon: '👁️', category: 'skill' },
  { key: 'disguise', label: '伪装', color: '#f59e0b', icon: '🎭', category: 'skill' },
  { key: 'clues', label: '线索', color: '#ef4444', icon: '🔍', category: 'skill' },
]

// ── Character StatMeta ──

const SHEN_MOHAN_METAS: StatMeta[] = [
  { key: 'affection', label: '好感', color: '#ff6b8a', icon: '💕', category: 'relation' },
]

const SHEN_LIE_METAS: StatMeta[] = [
  { key: 'affection', label: '好感', color: '#ff6b8a', icon: '💕', category: 'relation' },
]

const SHEN_YE_METAS: StatMeta[] = [
  { key: 'affection', label: '好感', color: '#ff6b8a', icon: '💕', category: 'relation' },
]

const LAO_ZHAO_METAS: StatMeta[] = [
  { key: 'trust', label: '信任', color: '#22c55e', icon: '🤝', category: 'relation' },
]

// ── Characters ──

const SHEN_MOHAN: Character = {
  id: 'shenmohan',
  name: '沈墨寒',
  portrait: '/characters/shenmohan.jpg',
  gender: 'male',
  age: 26,
  title: '沈氏集团副总裁',
  description: '温文尔雅的面具下是深不见底的掌控欲',
  personality: '温文尔雅 · 深沉莫测',
  speakingStyle: '措辞优雅，永远温和，暗含控制意味',
  secret: '书房保险箱里有一份转学申请——他曾阻止主角去外地上大学',
  triggerPoints: ['好感≥60邀请进书房', '好感≥85摘下完美面具'],
  behaviorPatterns: '用关怀和规则控制一切，从不动粗',
  themeColor: '#6366f1',
  joinDay: 1,
  statMetas: SHEN_MOHAN_METAS,
  initialStats: { affection: 40 },
}

const SHEN_LIE: Character = {
  id: 'shenlie',
  name: '沈烈',
  portrait: '/characters/shenlie.jpg',
  gender: 'male',
  age: 23,
  title: '职业拳击手',
  description: '暴脾气掩盖不住的笨拙深情',
  personality: '暴躁冲动 · 直白炽热',
  speakingStyle: '短句口语，情绪直接，骂人到一半转弯',
  secret: '偷偷保留了主角被摔碎的手机，没有扔掉',
  triggerPoints: ['好感≥40偶尔说内心话', '好感≥80愿意放手'],
  behaviorPatterns: '嘴硬心软，笨拙行动表达爱',
  themeColor: '#ef4444',
  joinDay: 1,
  statMetas: SHEN_LIE_METAS,
  initialStats: { affection: 30 },
}

const SHEN_YE: Character = {
  id: 'shenye',
  name: '沈夜',
  portrait: '/characters/shenye.jpg',
  gender: 'male',
  age: 20,
  title: '美院学生 / 失眠症患者',
  description: '沉默外表下是五年偏执的暗恋',
  personality: '沉默寡言 · 偏执暗涌',
  speakingStyle: '极少说话，声音很低，偶尔说出惊人的话',
  secret: '他是下药的人，也是最先提出囚禁计划的人',
  triggerPoints: ['好感≥60主动泄露别墅秘密', '好感≥85第一次安稳入睡'],
  behaviorPatterns: '安静如水，被刺激后突然失控',
  themeColor: '#8b5cf6',
  joinDay: 1,
  statMetas: SHEN_YE_METAS,
  initialStats: { affection: 50 },
}

const LAO_ZHAO: Character = {
  id: 'laozhao',
  name: '老赵',
  portrait: '/characters/laozhao.jpg',
  gender: 'male',
  age: 58,
  title: '沈家管家',
  description: '三十年忠仆，在忠诚与良知间摇摆',
  personality: '沉默忠诚 · 暗藏同情',
  speakingStyle: '敬语简短，偶尔欲言又止',
  secret: '知道三兄弟母亲的死因不简单',
  triggerPoints: ['信任≥25透露沈家旧事', '信任≥40暗中帮忙'],
  behaviorPatterns: '执行命令但会暗中同情',
  themeColor: '#78716c',
  joinDay: 1,
  statMetas: LAO_ZHAO_METAS,
  initialStats: { trust: 10 },
}

export function buildCharacters(): Record<string, Character> {
  return {
    shenmohan: SHEN_MOHAN,
    shenlie: SHEN_LIE,
    shenye: SHEN_YE,
    laozhao: LAO_ZHAO,
  }
}

// ── Scenes ──

export const SCENES: Record<string, Scene> = {
  bedroom: {
    id: 'bedroom',
    name: '我的卧室',
    icon: '🛏️',
    description: '精致的牢笼，一切日用品齐全，但门从外面锁着',
    background: '/scenes/bedroom.jpg',
    atmosphere: '熟悉又陌生的囚笼，窗外是触不到的花园',
    tags: ['私密', '初始'],
  },
  livingroom: {
    id: 'livingroom',
    name: '别墅客厅',
    icon: '🛋️',
    description: '挑高六米的大厅，水晶吊灯与防弹落地窗',
    background: '/scenes/livingroom.jpg',
    atmosphere: '奢华压抑，沈墨寒的主场',
    tags: ['社交', '博弈'],
    unlockCondition: { day: 2 },
  },
  kitchen: {
    id: 'kitchen',
    name: '厨房餐厅',
    icon: '🍳',
    description: '开放式西厨，刀架只剩黄油刀，沈烈的领地',
    background: '/scenes/kitchen.jpg',
    atmosphere: '被迫的家庭时间，也有深夜的温暖',
    tags: ['日常', '温情'],
    unlockCondition: { day: 3 },
  },
  garden: {
    id: 'garden',
    name: '花园露台',
    icon: '🌹',
    description: '修剪整齐的法式花园，三米围墙与蔷薇花架',
    background: '/scenes/garden.jpg',
    atmosphere: '唯一的户外空间，蔷薇甜香与碎玻璃围墙',
    tags: ['户外', '逃脱'],
    unlockCondition: { day: 5 },
  },
  study: {
    id: 'study',
    name: '大哥的书房',
    icon: '📚',
    description: '沈墨寒的私人禁地，藏着别墅安防系统和秘密',
    background: '/scenes/study.jpg',
    atmosphere: '雪松香与旧书味，权力和秘密的核心',
    tags: ['禁地', '线索'],
    unlockCondition: { day: 10, stat: { charId: 'shenmohan', key: 'affection', min: 60 } },
  },
}

// ── Items ──

export const ITEMS: Record<string, GameItem> = {
  hairpin: {
    id: 'hairpin',
    name: '发卡',
    icon: '📎',
    type: 'tool',
    description: '金属波浪发卡，可以尝试撬简单的锁',
  },
  diary: {
    id: 'diary',
    name: '日记本',
    icon: '📓',
    type: 'tool',
    description: '写下心事整理思绪，帮助维持心理状态',
  },
  sleepingpill: {
    id: 'sleepingpill',
    name: '安眠药',
    icon: '💊',
    type: 'tool',
    description: '氯硝西泮药片，可以制造行动窗口',
  },
  oldkey: {
    id: 'oldkey',
    name: '旧钥匙',
    icon: '🔑',
    type: 'clue',
    description: '铜质老钥匙，刻着"沈"字，能打开工具棚和旧柜子',
  },
  brokenphone: {
    id: 'brokenphone',
    name: '碎手机',
    icon: '📱',
    type: 'clue',
    description: '屏幕碎裂但主板可能还活着，是联系外界的唯一希望',
  },
  rosebrooch: {
    id: 'rosebrooch',
    name: '玫瑰胸针',
    icon: '🌹',
    type: 'gift',
    description: '红宝石花瓣金色茎叶，沈墨寒的礼物',
  },
}

// ── Chapters ──

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    name: '困兽',
    dayRange: [1, 7],
    description: '醒来、震惊、适应环境、试探三个哥哥的底线',
    objectives: ['了解被囚禁的原因', '试探安防系统', '建立与哥哥们的初步互动'],
    atmosphere: '迷茫 → 恐惧 → 冷静 → 开始思考对策',
  },
  {
    id: 2,
    name: '暗流',
    dayRange: [8, 16],
    description: '博弈、策略选择、发现别墅和哥哥们的秘密',
    objectives: ['选择应对策略', '收集逃脱线索', '了解哥哥们的真实内心'],
    atmosphere: '紧张的平衡，暗中积蓄力量',
  },
  {
    id: 3,
    name: '裂痕',
    dayRange: [17, 24],
    description: '三兄弟矛盾激化，旧日秘密被揭开，选择立场',
    objectives: ['在三兄弟间选择立场', '揭开母亲离开的真相', '为最终抉择做准备'],
    atmosphere: '山雨欲来，情感纠葛到达顶点',
  },
  {
    id: 4,
    name: '蔷薇',
    dayRange: [25, 30],
    description: '最终抉择与结局收束，父亲回国前的最后机会',
    objectives: ['做出最终决定', '面对所有人的真心'],
    atmosphere: '尘埃落定，或破碎或圆满',
  },
]

// ── Forced Events ──

export const FORCED_EVENTS: ForcedEvent[] = [
  {
    id: 'awakening',
    name: '醒来',
    triggerDay: 1,
    triggerPeriod: 0,
    description: '在陌生房间醒来，发现门被锁、手机消失、窗户加了锁扣',
  },
  {
    id: 'family_dinner',
    name: '家庭晚宴',
    triggerDay: 3,
    triggerPeriod: 2,
    description: '沈墨寒组织第一次正式晚餐，宣布"规矩"',
  },
  {
    id: 'first_attempt',
    name: '第一次试探',
    triggerDay: 7,
    triggerPeriod: 1,
    description: '主角第一次尝试逃跑或求助，必定失败但获得安防信息',
  },
  {
    id: 'midnight_studio',
    name: '深夜画室',
    triggerDay: 10,
    triggerPeriod: 2,
    description: '发现沈夜画室满墙都是主角的画像，时间跨度五年',
  },
  {
    id: 'brothers_clash',
    name: '冲突爆发',
    triggerDay: 15,
    triggerPeriod: 0,
    description: '沈烈和沈墨寒因为主角大吵一架，砸了客厅',
  },
  {
    id: 'truth_fragment',
    name: '真相碎片',
    triggerDay: 20,
    triggerPeriod: 1,
    description: '得知母亲离开的真正原因——她知道一切但选择了逃避',
  },
  {
    id: 'ultimatum',
    name: '最后通牒',
    triggerDay: 25,
    triggerPeriod: 2,
    description: '沈墨寒摊牌：父亲五天后回国，必须做出选择',
  },
]

// ── Endings ──

export const ENDINGS: Ending[] = [
  {
    id: 'be-butterfly',
    name: '蝴蝶标本',
    type: 'BE',
    description: '精神彻底崩溃，像一只被制成标本的蝴蝶，美丽但没有生命',
    condition: '心理≤15',
  },
  {
    id: 'be-fallen',
    name: '坠鸟',
    type: 'BE',
    description: '仓促逃跑失败，从围墙摔下，笼子变得更小了',
    condition: 'Day20后逃跑且线索<60且体力≤20',
  },
  {
    id: 'te-freedom',
    name: '破笼',
    type: 'TE',
    description: '完美伪装、周密计划，暴雨夜翻墙逃出别墅',
    condition: '线索≥80且伪装≥60',
  },
  {
    id: 'te-conspiracy',
    name: '共谋',
    type: 'TE',
    description: '沈烈在深夜打开大门，把车钥匙塞到你手里',
    condition: '沈烈好感≥80且线索≥50',
  },
  {
    id: 'he-rose',
    name: '蔷薇盛开',
    type: 'HE',
    description: '沈墨寒卸下面具，颤抖着打开门锁——你转身抱住了他',
    condition: '沈墨寒好感≥85且心理≥50',
  },
  {
    id: 'he-flame',
    name: '烈焰',
    type: 'HE',
    description: '沈烈带你骑摩托车冲出大门，不是逃跑，是私奔',
    condition: '沈烈好感≥85且心理≥50',
  },
  {
    id: 'he-moonlight',
    name: '月光',
    type: 'HE',
    description: '那个永远失眠的少年第一次安稳地睡着了',
    condition: '沈夜好感≥85且心理≥50',
  },
  {
    id: 'ne-endless',
    name: '无尽日常',
    type: 'NE',
    description: '三十天过去了，日子不好不坏，窗外蔷薇又开了一茬',
    condition: '未触发以上任何结局',
  },
]

// ── Story Info ──

export const STORY_INFO = {
  title: '蔷薇牢笼',
  subtitle: '被囚禁的第三十天',
  description: '被三位继兄囚禁在别墅中，在30天内决定自己的命运——逃脱、接受、或选择某个人的爱',
  objective: '在囚笼中找到自己的道路',
  era: '现代都市',
}

// ── Quick Actions ──

export const QUICK_ACTIONS: string[] = [
  '观察环境',
  '搜索线索',
  '找人交谈',
  '安静等待',
]

// ── Utility Functions ──

export function getStatLevel(value: number) {
  if (value >= 80) return { level: 4, name: '深陷其中', color: '#ff6b8a' }
  if (value >= 60) return { level: 3, name: '暗潮涌动', color: '#f472b6' }
  if (value >= 30) return { level: 2, name: '若即若离', color: '#94a3b8' }
  return { level: 1, name: '冷漠疏离', color: '#64748b' }
}

export function getAvailableCharacters(
  day: number,
  characters: Record<string, Character>
): Record<string, Character> {
  return Object.fromEntries(
    Object.entries(characters).filter(([, char]) => char.joinDay <= day)
  )
}

export function getCurrentChapter(day: number): Chapter {
  return CHAPTERS.find((ch) => day >= ch.dayRange[0] && day <= ch.dayRange[1])
    ?? CHAPTERS[0]
}

export function getDayEvents(
  day: number,
  triggeredEvents: string[]
): ForcedEvent[] {
  return FORCED_EVENTS.filter(
    (e) => e.triggerDay === day && !triggeredEvents.includes(e.id)
  )
}
