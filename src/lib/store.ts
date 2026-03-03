/**
 * [INPUT]: script.md(?raw), stream.ts, data.ts, parser.ts
 * [OUTPUT]: useGameStore (Zustand hook) + re-exports from data.ts
 * [POS]: lib state hub — script-through + rich messages + drawers + dual-track parsing + chain reactions
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import GAME_SCRIPT from './script.md?raw'
import { streamChat, chat } from './stream'
import { extractChoices } from './parser'
import {
  type Character, type CharacterStats, type Message, type StatMeta, type StoryRecord,
  PERIODS, MAX_DAYS, MAX_ACTION_POINTS,
  SCENES, ITEMS, STORY_INFO, PLAYER_STAT_METAS,
  buildCharacters, getCurrentChapter, getDayEvents,
} from './data'

// ── Types ──

interface PlayerStats {
  stamina: number
  mental: number
  alertness: number
  disguise: number
  clues: number
}

interface GameState {
  gameStarted: boolean
  playerName: string
  characters: Record<string, Character>

  currentDay: number
  currentPeriodIndex: number
  actionPoints: number
  playerStats: PlayerStats

  currentScene: string
  currentCharacter: string | null
  characterStats: Record<string, CharacterStats>
  unlockedScenes: string[]

  currentChapter: number
  triggeredEvents: string[]
  inventory: Record<string, number>

  messages: Message[]
  historySummary: string
  isTyping: boolean
  streamingContent: string
  choices: string[]

  endingType: string | null

  activeTab: 'dashboard' | 'scene' | 'dialogue' | 'character' | 'records'
  showMenu: boolean
  storyRecords: StoryRecord[]
}

interface GameActions {
  setPlayerInfo: (name: string) => void
  initGame: () => void
  selectCharacter: (charId: string | null) => void
  selectScene: (sceneId: string) => void
  setActiveTab: (tab: 'dashboard' | 'scene' | 'dialogue' | 'character' | 'records') => void
  toggleMenu: () => void
  sendMessage: (text: string) => Promise<void>
  advanceTime: () => void
  useItem: (itemId: string) => void
  checkEnding: () => void
  addSystemMessage: (text: string) => void
  addStoryRecord: (title: string, content: string) => void
  resetGame: () => void
  saveGame: () => void
  loadGame: () => void
  hasSave: () => boolean
  clearSave: () => void
}

type GameStore = GameState & GameActions

let messageCounter = 0
const makeId = () => `msg-${Date.now()}-${++messageCounter}`
const SAVE_KEY = 'qw-save-v1'

// ── Dual-track stat parser ──

interface StatChangeResult {
  charChanges: Array<{ charId: string; stat: string; delta: number }>
  globalChanges: Array<{ key: string; delta: number }>
}

function parseStatChanges(
  content: string,
  characters: Record<string, Character>
): StatChangeResult {
  const charChanges: StatChangeResult['charChanges'] = []
  const globalChanges: StatChangeResult['globalChanges'] = []

  const nameToId: Record<string, string> = {}
  for (const [id, char] of Object.entries(characters)) {
    nameToId[char.name] = id
  }

  const labelToKey: Record<string, Array<{ charId: string; key: string }>> = {}
  for (const [charId, char] of Object.entries(characters)) {
    for (const meta of char.statMetas) {
      const labels = [meta.label, meta.label.replace(/度$/, ''), meta.label + '值']
      for (const label of labels) {
        if (!labelToKey[label]) labelToKey[label] = []
        labelToKey[label].push({ charId, key: meta.key })
      }
    }
  }

  const GLOBAL_ALIASES: Record<string, string> = {
    '体力': 'stamina', '体力值': 'stamina',
    '心理': 'mental', '心理值': 'mental', '精神': 'mental',
    '警觉': 'alertness', '警觉值': 'alertness', '警觉度': 'alertness',
    '伪装': 'disguise', '伪装值': 'disguise', '伪装度': 'disguise',
    '线索': 'clues', '线索值': 'clues', '线索量': 'clues',
  }

  // Track 1: 【角色名 数值+N】
  const charRegex = /[【\[]([^\]】]+?)\s+(\S+?)([+-])(\d+)[】\]]/g
  let match
  while ((match = charRegex.exec(content))) {
    const [, context, statLabel, sign, numStr] = match
    const delta = parseInt(numStr) * (sign === '+' ? 1 : -1)
    const charId = nameToId[context]
    if (charId) {
      const entries = labelToKey[statLabel]
      const entry = entries?.find((e) => e.charId === charId) || entries?.[0]
      if (entry) {
        charChanges.push({ charId: entry.charId, stat: entry.key, delta })
      }
    }
  }

  // Track 2: 【Stat+N】
  const globalRegex = /[【\[](\S+?)([+-])(\d+)[】\]]/g
  let gMatch
  while ((gMatch = globalRegex.exec(content))) {
    const [fullMatch, label, sign, numStr] = gMatch
    if (fullMatch.includes(' ')) continue
    const delta = parseInt(numStr) * (sign === '+' ? 1 : -1)
    const globalKey = GLOBAL_ALIASES[label]
    if (globalKey) {
      globalChanges.push({ key: globalKey, delta })
    }
  }

  return { charChanges, globalChanges }
}

// ── System prompt builder ──

function buildStatsSnapshot(state: GameState): string {
  return Object.entries(state.characterStats)
    .map(([charId, stats]) => {
      const char = state.characters[charId]
      if (!char) return ''
      const lines = char.statMetas
        .map((m: StatMeta) => `  ${m.icon} ${m.label}: ${stats[m.key] ?? 0}/100`)
        .join('\n')
      return `${char.name}:\n${lines}`
    })
    .filter(Boolean)
    .join('\n')
}

function buildSystemPrompt(state: GameState): string {
  const char = state.currentCharacter
    ? state.characters[state.currentCharacter]
    : null
  const chapter = getCurrentChapter(state.currentDay)
  const scene = SCENES[state.currentScene]

  const playerStatLines = PLAYER_STAT_METAS
    .map((m) => `  ${m.icon} ${m.label}: ${state.playerStats[m.key as keyof PlayerStats] ?? 0}/100`)
    .join('\n')

  return `你是《${STORY_INFO.title}》的AI叙述者。

## 游戏剧本
${GAME_SCRIPT}

## 当前状态
玩家「${state.playerName}」
第${state.currentDay}天 · ${PERIODS[state.currentPeriodIndex].name}
第${chapter.id}章「${chapter.name}」
当前场景：${scene?.name ?? '未知'}
${char ? `当前交互角色：${char.name}` : '无特定交互对象'}
行动力：${state.actionPoints}/${MAX_ACTION_POINTS}

## 玩家属性
${playerStatLines}

## NPC数值
${buildStatsSnapshot(state)}

## 背包
${Object.entries(state.inventory).filter(([, v]) => v > 0).map(([k, v]) => `${ITEMS[k]?.name} x${v}`).join('、') || '空'}

## 已触发事件
${state.triggeredEvents.join('、') || '无'}

## 输出格式
- 每段回复 800-1200 字，以第二人称"你"叙述
- 角色对话：【角色名】"对话内容"
- 获得物品：【获得 物品名】
- 支持 Markdown 格式（**加粗**、*斜体*、> 引用、表格等）
- 严格遵循剧本中每位角色的说话风格和行为逻辑

## 数值变化标注（必须严格遵守！）
每次回复末尾（选项之前）必须标注本次互动产生的所有数值变化，缺一不可：
- 角色数值变化：【角色名 好感+N】或【角色名 信任+N】（N通常为3-10）
- 全局属性变化：【体力-N】【心理+N】【警觉+N】【伪装+N】【线索+N】
示例：
（叙述内容）
【沈墨寒 好感+5】【体力-3】【心理-2】【警觉+5】
1. 选项一
2. 选项二
规则：
- 每次回复至少产生1个数值变化
- 好感/信任变化必须与当前互动的角色相关
- 全局属性至少标注1个变化（尤其是体力消耗、心理变化）

## 选项系统（必须严格遵守）
每次回复末尾必须给出恰好4个行动选项，格式严格如下：
1. 选项文本（简洁，15字以内）
2. 选项文本
3. 选项文本
4. 选项文本
规则：
- 必须恰好4个，不能多也不能少
- 选项前不要加"你的选择"等标题行
- 选项应涵盖不同策略方向（顺从/反抗/周旋/观察 或其变体）
- 每个选项要具体、有剧情推动力，不要笼统`
}

// ── Store ──

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // ── Initial state ──
    gameStarted: false,
    playerName: '',
    characters: buildCharacters(),

    currentDay: 1,
    currentPeriodIndex: 0,
    actionPoints: MAX_ACTION_POINTS,
    playerStats: { stamina: 70, mental: 60, alertness: 30, disguise: 20, clues: 0 },

    currentScene: 'bedroom',
    currentCharacter: null,
    characterStats: Object.fromEntries(
      Object.entries(buildCharacters()).map(([id, char]) => [id, { ...char.initialStats }])
    ),
    unlockedScenes: ['bedroom'],

    currentChapter: 1,
    triggeredEvents: [],
    inventory: {},

    messages: [],
    historySummary: '',
    isTyping: false,
    streamingContent: '',
    choices: [],

    endingType: null,

    activeTab: 'dialogue',
    showMenu: false,
    storyRecords: [],

    // ── Actions ──

    setPlayerInfo: (name: string) => {
      set((s) => { s.playerName = name })
    },

    initGame: () => {
      set((s) => {
        s.gameStarted = true
        s.messages.push({
          id: makeId(),
          role: 'system',
          content: `你在一间熟悉又陌生的房间里醒来。头很沉，嘴里有残留的甜腻味道。\n\n窗户加了锁扣，门从外面反锁。床头放着一束新鲜的红玫瑰，还有一张字条——\n\n> "别怕，哥哥们会照顾好你的。"\n\n手机不见了。你的故事，从这里开始。`,
          timestamp: Date.now(),
        })
        s.choices = ['仔细观察房间', '试着推门', '查看窗户', '翻找梳妆台']
      })
    },

    selectCharacter: (charId: string | null) => {
      set((s) => {
        s.currentCharacter = charId
        if (charId) s.activeTab = 'dialogue'
      })
    },

    selectScene: (sceneId: string) => {
      const state = get()
      if (!state.unlockedScenes.includes(sceneId)) return
      if (state.currentScene === sceneId) return

      set((s) => {
        s.currentScene = sceneId
        s.activeTab = 'dialogue'
        s.messages.push({
          id: makeId(),
          role: 'system',
          content: `你来到了${SCENES[sceneId].name}。`,
          timestamp: Date.now(),
          type: 'scene-transition',
          sceneId,
        })
      })
    },

    setActiveTab: (tab) => {
      set((s) => { s.activeTab = tab })
    },

    toggleMenu: () => {
      set((s) => { s.showMenu = !s.showMenu })
    },

    sendMessage: async (text: string) => {
      set((s) => {
        s.messages.push({
          id: makeId(), role: 'user', content: text, timestamp: Date.now(),
        })
        s.isTyping = true
        s.streamingContent = ''
      })

      try {
        const state = get()

        // History compression
        if (state.messages.length > 15 && !state.historySummary) {
          const summary = await chat([
            { role: 'system', content: '将以下对话压缩为200字以内的摘要，保留关键剧情、数值变化和情感转折：' },
            ...state.messages.slice(0, -5).map((m) => ({
              role: m.role, content: m.content,
            })),
          ])
          set((s) => { s.historySummary = summary })
        }

        // Build system prompt with GAME_SCRIPT
        const systemPrompt = buildSystemPrompt(get())
        const apiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...(get().historySummary
            ? [{ role: 'system' as const, content: `历史摘要: ${get().historySummary}` }]
            : []),
          ...get().messages.slice(-10).map((m) => ({
            role: m.role, content: m.content,
          })),
        ]

        // Stream SSE
        let fullContent = ''
        await streamChat(
          apiMessages,
          (chunk) => {
            fullContent += chunk
            set((s) => { s.streamingContent = fullContent })
          },
          () => {},
        )

        // Parse dual-track stat changes
        const { charChanges, globalChanges } = parseStatChanges(fullContent, get().characters)

        // Apply changes
        set((s) => {
          for (const change of charChanges) {
            const stats = s.characterStats[change.charId]
            if (stats) {
              stats[change.stat] = Math.max(0, Math.min(100, (stats[change.stat] ?? 0) + change.delta))
            }
          }
          for (const change of globalChanges) {
            const key = change.key as keyof PlayerStats
            if (key in s.playerStats) {
              s.playerStats[key] = Math.max(0, Math.min(100, s.playerStats[key] + change.delta))
            }
          }
        })

        // Chain reactions: brothers' jealousy
        set((s) => {
          // If any brother's affection ≥ 70, other brothers' affection decreases
          const brothers = ['shenmohan', 'shenlie', 'shenye']
          for (const charId of brothers) {
            const aff = s.characterStats[charId]?.affection ?? 0
            if (aff >= 70 && !s.triggeredEvents.includes(`chain_jealousy_${charId}`)) {
              for (const otherId of brothers) {
                if (otherId !== charId) {
                  const otherStats = s.characterStats[otherId]
                  if (otherStats && (otherStats.affection ?? 0) > 30) {
                    otherStats.affection = Math.max(0, (otherStats.affection ?? 0) - 3)
                  }
                }
              }
              s.triggeredEvents.push(`chain_jealousy_${charId}`)
            }
          }
        })

        // Check BE condition: mental ≤ 15
        if (get().playerStats.mental <= 15) {
          set((s) => { s.endingType = 'be-butterfly' })
        }

        // Extract choices from AI response
        const { cleanContent, choices } = extractChoices(fullContent)

        // Fallback: context-aware choices
        const finalChoices = choices.length >= 2 ? choices : (() => {
          const char = get().currentCharacter
            ? get().characters[get().currentCharacter!]
            : null
          if (char) {
            return [
              `和${char.name}交谈`,
              `观察${char.name}的反应`,
              `转身离开`,
              '四处搜索线索',
            ]
          }
          return ['观察周围环境', '搜索有用的东西', '找人交谈', '安静等待']
        })()

        // Push AI message
        set((s) => {
          s.messages.push({
            id: makeId(),
            role: 'assistant',
            content: cleanContent,
            character: s.currentCharacter ?? undefined,
            timestamp: Date.now(),
          })
          s.choices = finalChoices.slice(0, 4)
          s.isTyping = false
          s.streamingContent = ''
        })

        // Advance time + save
        get().advanceTime()
        get().saveGame()

        // Story record
        const charName = get().currentCharacter
          ? get().characters[get().currentCharacter!]?.name
          : null
        get().addStoryRecord(charName ?? '日常', cleanContent.slice(0, 40))

      } catch (err) {
        set((s) => { s.isTyping = false; s.streamingContent = '' })
        const msg = err instanceof Error ? err.message : String(err)
        get().addSystemMessage(`网络异常: ${msg.slice(0, 80)}`)
      }
    },

    advanceTime: () => {
      let dayChanged = false

      set((s) => {
        s.actionPoints -= 1
        s.currentPeriodIndex += 1

        if (s.currentPeriodIndex >= PERIODS.length) {
          s.currentPeriodIndex = 0
          s.currentDay += 1
          s.actionPoints = MAX_ACTION_POINTS
          dayChanged = true

          // Daily passive decay
          s.playerStats.stamina = Math.max(0, s.playerStats.stamina - 2)
          s.playerStats.mental = Math.max(0, s.playerStats.mental - 3)

          // Auto-unlock scenes by day
          for (const [sceneId, scene] of Object.entries(SCENES)) {
            if (
              scene.unlockCondition?.day &&
              s.currentDay >= scene.unlockCondition.day &&
              !s.unlockedScenes.includes(sceneId)
            ) {
              s.unlockedScenes.push(sceneId)
            }
          }

          // Chapter progression
          const newChapter = getCurrentChapter(s.currentDay)
          if (newChapter.id !== s.currentChapter) {
            s.currentChapter = newChapter.id
            s.storyRecords.push({
              id: `rec-ch-${newChapter.id}`,
              day: s.currentDay,
              period: PERIODS[0].name,
              title: `进入「${newChapter.name}」`,
              content: newChapter.description,
            })
          }
        }
      })

      const state = get()

      // Rich message: day change
      if (dayChanged) {
        const chapter = getCurrentChapter(state.currentDay)
        set((s) => {
          s.messages.push({
            id: makeId(),
            role: 'system',
            content: '',
            timestamp: Date.now(),
            type: 'day-change',
            dayInfo: { day: state.currentDay, chapter: chapter.name },
          })
        })
        get().addStoryRecord('日变', `第${state.currentDay}天`)
      }

      // Forced events
      const events = getDayEvents(state.currentDay, state.triggeredEvents)
      for (const event of events) {
        if (event.triggerPeriod === undefined || event.triggerPeriod === state.currentPeriodIndex) {
          set((s) => {
            s.triggeredEvents.push(event.id)
            s.storyRecords.push({
              id: `rec-evt-${event.id}`,
              day: state.currentDay,
              period: PERIODS[state.currentPeriodIndex].name,
              title: event.name,
              content: event.description,
            })
          })
          get().addSystemMessage(`【${event.name}】${event.description}`)
        }
      }

      // Time ending check
      if (state.currentDay >= MAX_DAYS && state.currentPeriodIndex === PERIODS.length - 1) {
        get().checkEnding()
      }
    },

    useItem: (itemId: string) => {
      set((s) => {
        const count = s.inventory[itemId] ?? 0
        if (count <= 0) return
        s.inventory[itemId] = count - 1
      })
      const item = ITEMS[itemId]
      if (item) {
        get().addSystemMessage(`使用了${item.icon} ${item.name}`)
      }
    },

    checkEnding: () => {
      const state = get()
      const setEnding = (id: string) => {
        set((s) => { s.endingType = id })
      }

      // BE1: 蝴蝶标本 — mental ≤ 15
      if (state.playerStats.mental <= 15) {
        setEnding('be-butterfly')
        return
      }

      // BE2: 坠鸟 — clues < 60 & stamina ≤ 20 & day ≥ 20
      if (state.playerStats.clues < 60 && state.playerStats.stamina <= 20 && state.currentDay >= 20) {
        setEnding('be-fallen')
        return
      }

      // TE1: 破笼 — clues ≥ 80 & disguise ≥ 60
      if (state.playerStats.clues >= 80 && state.playerStats.disguise >= 60) {
        setEnding('te-freedom')
        return
      }

      // TE2: 共谋 — 沈烈 affection ≥ 80 & clues ≥ 50
      if ((state.characterStats.shenlie?.affection ?? 0) >= 80 && state.playerStats.clues >= 50) {
        setEnding('te-conspiracy')
        return
      }

      // HE1: 蔷薇盛开 — 沈墨寒 affection ≥ 85 & mental ≥ 50
      if ((state.characterStats.shenmohan?.affection ?? 0) >= 85 && state.playerStats.mental >= 50) {
        setEnding('he-rose')
        return
      }

      // HE2: 烈焰 — 沈烈 affection ≥ 85 & mental ≥ 50
      if ((state.characterStats.shenlie?.affection ?? 0) >= 85 && state.playerStats.mental >= 50) {
        setEnding('he-flame')
        return
      }

      // HE3: 月光 — 沈夜 affection ≥ 85 & mental ≥ 50
      if ((state.characterStats.shenye?.affection ?? 0) >= 85 && state.playerStats.mental >= 50) {
        setEnding('he-moonlight')
        return
      }

      // NE: 无尽日常 — fallback
      setEnding('ne-endless')
    },

    addSystemMessage: (text: string) => {
      set((s) => {
        s.messages.push({
          id: makeId(), role: 'system', content: text, timestamp: Date.now(),
        })
      })
    },

    addStoryRecord: (title: string, content: string) => {
      const state = get()
      set((s) => {
        s.storyRecords.push({
          id: makeId(),
          day: state.currentDay,
          period: PERIODS[state.currentPeriodIndex]?.name ?? '',
          title,
          content,
        })
      })
    },

    resetGame: () => {
      set((s) => {
        s.gameStarted = false
        s.playerName = ''
        s.characters = buildCharacters()
        s.currentDay = 1
        s.currentPeriodIndex = 0
        s.actionPoints = MAX_ACTION_POINTS
        s.playerStats = { stamina: 70, mental: 60, alertness: 30, disguise: 20, clues: 0 }
        s.currentScene = 'bedroom'
        s.currentCharacter = null
        s.characterStats = Object.fromEntries(
          Object.entries(buildCharacters()).map(([id, char]) => [id, { ...char.initialStats }])
        )
        s.unlockedScenes = ['bedroom']
        s.currentChapter = 1
        s.triggeredEvents = []
        s.inventory = {}
        s.messages = []
        s.historySummary = ''
        s.isTyping = false
        s.streamingContent = ''
        s.choices = []
        s.endingType = null
        s.activeTab = 'dialogue'
        s.showMenu = false
        s.storyRecords = []
      })
      get().clearSave()
    },

    saveGame: () => {
      const s = get()
      const data = {
        version: 1,
        playerName: s.playerName,
        characters: s.characters,
        currentDay: s.currentDay,
        currentPeriodIndex: s.currentPeriodIndex,
        actionPoints: s.actionPoints,
        playerStats: s.playerStats,
        currentScene: s.currentScene,
        currentCharacter: s.currentCharacter,
        characterStats: s.characterStats,
        currentChapter: s.currentChapter,
        triggeredEvents: s.triggeredEvents,
        unlockedScenes: s.unlockedScenes,
        inventory: s.inventory,
        messages: s.messages.slice(-30),
        historySummary: s.historySummary,
        endingType: s.endingType,
        activeTab: s.activeTab,
        storyRecords: s.storyRecords.slice(-50),
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    },

    loadGame: () => {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        if (data.version !== 1) return
        set((s) => {
          s.gameStarted = true
          s.playerName = data.playerName
          s.characters = data.characters ?? buildCharacters()
          s.currentDay = data.currentDay
          s.currentPeriodIndex = data.currentPeriodIndex
          s.actionPoints = data.actionPoints
          s.playerStats = data.playerStats ?? { stamina: 70, mental: 60, alertness: 30, disguise: 20, clues: 0 }
          s.currentScene = data.currentScene
          s.currentCharacter = data.currentCharacter
          s.characterStats = data.characterStats
          s.currentChapter = data.currentChapter
          s.triggeredEvents = data.triggeredEvents
          s.unlockedScenes = data.unlockedScenes
          s.inventory = data.inventory ?? {}
          s.messages = data.messages ?? []
          s.historySummary = data.historySummary ?? ''
          s.endingType = data.endingType
          s.activeTab = data.activeTab ?? 'dialogue'
          s.storyRecords = data.storyRecords ?? []
        })
      } catch { /* corrupted save */ }
    },

    hasSave: () => !!localStorage.getItem(SAVE_KEY),

    clearSave: () => { localStorage.removeItem(SAVE_KEY) },
  }))
)

// ── Re-export data.ts ──

export {
  SCENES, ITEMS, PERIODS, CHAPTERS,
  MAX_DAYS, MAX_ACTION_POINTS,
  STORY_INFO, FORCED_EVENTS, ENDINGS,
  QUICK_ACTIONS, PLAYER_STAT_METAS,
  buildCharacters, getCurrentChapter,
  getStatLevel, getAvailableCharacters, getDayEvents,
} from './data'

export type {
  Character, CharacterStats, Scene, GameItem, Chapter,
  ForcedEvent, Ending, TimePeriod, Message, StatMeta, StoryRecord,
} from './data'
