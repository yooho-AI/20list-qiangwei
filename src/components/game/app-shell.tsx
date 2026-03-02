/**
 * [INPUT]: store.ts (useGameStore), tab components, dashboard, bgm
 * [OUTPUT]: 唯一布局壳 — Header + 5Tab路由 + TabBar + 菜单
 * [POS]: components/game 的布局入口，零 isMobile 分叉，5Tab导航
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useGameStore, PERIODS, STORY_INFO,
  getCurrentChapter, MAX_DAYS,
} from '../../lib/store'
import { useBgm } from '../../lib/bgm'
import {
  ChatCircle, MapTrifold, Users,
  Notebook, Scroll, MusicNotes, SpeakerSimpleSlash,
  List, FloppyDisk, FolderOpen, ArrowClockwise, Play,
  Lightning, NoteBlank,
} from '@phosphor-icons/react'
import TabDialogue from './tab-dialogue'
import TabScene from './tab-scene'
import TabCharacter from './tab-character'
import DashboardDrawer from './dashboard-drawer'

const P = 'qw'

type TabKey = 'dashboard' | 'scene' | 'dialogue' | 'character' | 'records'

const TAB_CONFIG: Array<{ key: TabKey; label: string; Icon: typeof Notebook }> = [
  { key: 'dashboard', label: '手册', Icon: Notebook },
  { key: 'scene', label: '场景', Icon: MapTrifold },
  { key: 'dialogue', label: '对话', Icon: ChatCircle },
  { key: 'character', label: '人物', Icon: Users },
  { key: 'records', label: '事件', Icon: Scroll },
]

export default function AppShell() {
  const {
    activeTab, setActiveTab,
    currentDay, currentPeriodIndex, actionPoints,
    showMenu, toggleMenu,
    saveGame,
    storyRecords,
  } = useGameStore()

  const { isPlaying, toggle: toggleBgm } = useBgm()

  const chapter = getCurrentChapter(currentDay)
  const period = PERIODS[currentPeriodIndex]

  // Toast
  const [toast, setToast] = useState('')
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }, [])

  // Menu actions
  const handleSave = useCallback(() => {
    saveGame()
    showToast('已保存')
    toggleMenu()
  }, [saveGame, showToast, toggleMenu])

  const handleLoad = useCallback(() => {
    useGameStore.getState().loadGame()
    toggleMenu()
  }, [toggleMenu])

  const handleReset = useCallback(() => {
    useGameStore.getState().clearSave()
    useGameStore.getState().resetGame()
  }, [])

  return (
    <div className={`${P}-shell`}>
      {/* Header */}
      <header className={`${P}-header`}>
        <div className={`${P}-header-left`}>
          <span className={`${P}-ap-badge`}><Lightning size={13} weight="fill" /> {actionPoints}</span>
        </div>
        <div className={`${P}-header-center`}>
          <span className={`${P}-header-time`}>
            第{currentDay}/{MAX_DAYS}天 · {period?.icon} {period?.name}
          </span>
          <span className={`${P}-header-chapter`}>第{chapter.id}章 · {chapter.name}</span>
        </div>
        <div className={`${P}-header-right`}>
          <button
            className={`${P}-header-btn`}
            onClick={toggleBgm}
            title={isPlaying ? '暂停音乐' : '播放音乐'}
          >
            {isPlaying ? <MusicNotes size={18} /> : <SpeakerSimpleSlash size={18} />}
          </button>
          <button className={`${P}-header-btn`} onClick={toggleMenu} title="菜单">
            <List size={18} />
          </button>
        </div>
      </header>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <DashboardDrawer />
            </motion.div>
          )}
          {activeTab === 'scene' && (
            <motion.div key="scene"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%', overflowY: 'auto' }}>
              <TabScene />
            </motion.div>
          )}
          {activeTab === 'dialogue' && (
            <motion.div key="dialogue"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%' }}>
              <TabDialogue />
            </motion.div>
          )}
          {activeTab === 'character' && (
            <motion.div key="character"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%', overflowY: 'auto' }}>
              <TabCharacter />
            </motion.div>
          )}
          {activeTab === 'records' && (
            <motion.div key="records"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%', overflowY: 'auto', padding: '20px 16px' }}>
              <div className={`${P}-record-title`}><Scroll size={16} /> 事件记录</div>
              <div className={`${P}-record-timeline`}>
                {[...storyRecords].reverse().map((rec) => (
                  <div key={rec.id} className={`${P}-record-item`}>
                    <div className={`${P}-record-dot`} />
                    <div className={`${P}-record-meta`}>
                      第{rec.day}天 · {rec.period}
                    </div>
                    <div className={`${P}-record-event-title`}>{rec.title}</div>
                    <div className={`${P}-record-event-content`}>
                      {rec.content.slice(0, 60)}
                    </div>
                  </div>
                ))}
                {storyRecords.length === 0 && (
                  <div className={`${P}-empty`}>
                    <div className={`${P}-empty-icon`}><NoteBlank size={32} /></div>
                    <div className={`${P}-empty-text`}>还没有事件记录</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Bar — 5 tabs */}
      <nav className={`${P}-tab-bar`}>
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            className={`${P}-tab-item ${activeTab === tab.key ? `${P}-tab-active` : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.Icon size={20} weight={activeTab === tab.key ? 'fill' : 'regular'} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            className={`${P}-menu-overlay`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMenu}
          >
            <motion.div
              className={`${P}-menu-panel`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, marginBottom: 20, textAlign: 'center' }}>
                {STORY_INFO.title}
              </h3>
              <button className={`${P}-menu-btn`} onClick={handleSave}><FloppyDisk size={16} /> 保存进度</button>
              <button className={`${P}-menu-btn`} onClick={handleLoad}><FolderOpen size={16} /> 读取存档</button>
              <button className={`${P}-menu-btn danger`} onClick={handleReset}><ArrowClockwise size={16} /> 重新开始</button>
              <button className={`${P}-menu-btn`} onClick={toggleMenu}><Play size={16} weight="fill" /> 继续游戏</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`${P}-toast`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
