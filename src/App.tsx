/**
 * [INPUT]: store.ts (useGameStore, ENDINGS), analytics, bgm
 * [OUTPUT]: Root component: 3-phase opening (awakening -> letter -> name) + GameScreen + EndingModal
 * [POS]: App entry point, no isMobile branching. Fixed female protagonist.
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */
import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, ENDINGS } from './lib/store'
import { useBgm } from './lib/bgm'
import { trackGameStart, trackGameContinue, trackPlayerCreate } from './lib/analytics'
import AppShell from './components/game/app-shell'
import './styles/globals.css'
import './styles/opening.css'
import './styles/rich-cards.css'

const P = 'qw'

// ── Ending Type Map (data-driven, zero if/else) ──
const ENDING_TYPE_MAP: Record<string, { label: string; color: string; icon: string }> = {
  BE: { label: 'Bad Ending', color: '#9e1b32', icon: '🥀' },
  TE: { label: 'True Ending', color: '#c9a84c', icon: '🗝️' },
  HE: { label: 'Happy Ending', color: '#f472b6', icon: '🌹' },
  NE: { label: 'Normal Ending', color: '#94a3b8', icon: '🌙' },
}

// ── Start Screen (3-phase opening) ──
function StartScreen() {
  const { setPlayerInfo, initGame, loadGame, hasSave, sendMessage } = useGameStore()
  const { toggle: toggleBgm, isPlaying } = useBgm()
  const saved = hasSave()
  const [phase, setPhase] = useState<'awaken' | 'letter' | 'name'>('awaken')
  const [name, setName] = useState('苏念')
  const [awakenStep, setAwakenStep] = useState(0)

  // CSS-animated particles
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${4 + Math.random() * 6}s`,
  })), [])

  // Phase 1: timed awakening sequence
  useEffect(() => {
    if (phase !== 'awaken') return
    const timers = [
      setTimeout(() => setAwakenStep(1), 800),
      setTimeout(() => setAwakenStep(2), 3000),
      setTimeout(() => setAwakenStep(3), 5000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [phase])

  // Phase 2: auto-advance after letter
  useEffect(() => {
    if (phase !== 'letter') return
    const t = setTimeout(() => setPhase('name'), 5000)
    return () => clearTimeout(t)
  }, [phase])

  const handleStart = useCallback(() => { trackGameStart(); setPhase('letter') }, [])
  const handleContinue = useCallback(() => { trackGameContinue(); loadGame() }, [loadGame])
  const handleBegin = useCallback(() => {
    if (!name.trim()) return
    trackPlayerCreate(name); setPlayerInfo(name); initGame()
    // 自动发送第一条消息触发 AI 开场
    setTimeout(() => sendMessage('开始游戏'), 500)
  }, [name, setPlayerInfo, initGame, sendMessage])

  return (
    <div className={`${P}-start`}>
      <AnimatePresence mode="wait">
        {/* ── Phase 1: 黑屏苏醒 ── */}
        {phase === 'awaken' && (
          <motion.div key="awaken" className={`${P}-awaken`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}>
            <div className={`${P}-vignette`} />
            <div className={`${P}-rose-silhouette`}>
              <svg viewBox="0 0 100 100"><text y=".9em" fontSize="90">🥀</text></svg>
            </div>
            {particles.map((p) => (
              <div key={p.id} className={`${P}-particle`}
                style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }} />
            ))}
            <AnimatePresence>
              {awakenStep >= 1 && (
                <motion.p className={`${P}-awaken-text`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
                  你的意识逐渐清醒...
                </motion.p>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {awakenStep >= 1 && (
                <motion.p className={`${P}-awaken-text-dim`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 1 }}>
                  头很沉...嘴里有残留的甜腻味道...
                </motion.p>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {awakenStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2 }}>
                  <h1 className={`${P}-awaken-title`}>蔷薇牢笼</h1>
                  <p className={`${P}-awaken-subtitle`}>被囚禁的第三十天</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {awakenStep >= 3 && (
                <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}>
                  <button className={`${P}-start-cta`} onClick={handleStart}>睁开眼</button>
                  {saved && (
                    <button className={`${P}-continue-btn`} onClick={handleContinue}>继续上次</button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`${P}-music-bar ${!isPlaying ? 'paused' : ''}`} onClick={toggleBgm}>
              <span /><span /><span /><span />
            </div>
          </motion.div>
        )}

        {/* ── Phase 2: 诡异字条 ── */}
        {phase === 'letter' && (
          <motion.div key="letter" className={`${P}-letter`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}>
            <div className={`${P}-letter-vignette`} />
            <div className={`${P}-ink-blot`} style={{ top: '30%', left: '20%' }} />
            <div className={`${P}-ink-blot`} style={{ top: '60%', right: '15%', animationDelay: '2s' }} />
            <motion.div className={`${P}-letter-note`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1.0 }}>
              <div className={`${P}-letter-text`}>别怕，哥哥们会照顾好你的。</div>
              <div className={`${P}-letter-signature`}>—— 你的三位哥哥</div>
            </motion.div>
            <motion.button className={`${P}-skip-btn`}
              onClick={() => setPhase('name')}
              initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 1.5 }}>
              跳过 ›
            </motion.button>
          </motion.div>
        )}

        {/* ── Phase 3: 姓名输入 ── */}
        {phase === 'name' && (
          <motion.div key="name" className={`${P}-create`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}>
            <div className={`${P}-create-bars`}>
              <span /><span /><span /><span /><span />
            </div>
            <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}>
              <div className={`${P}-create-title`}>你是谁？</div>
              <div className={`${P}-create-desc`}>
                你从昏迷中醒来，发现自己身处一座陌生的别墅。<br />
                记忆模糊，只记得自己的名字...
              </div>
              <div className={`${P}-create-label`}>输入角色名</div>
              <input className={`${P}-create-input`} type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="苏念" maxLength={8} autoFocus />
              <button className={`${P}-create-random`} onClick={() => setPhase('awaken')}>
                ← 返回
              </button>
              <button className={`${P}-create-start`} onClick={handleBegin} disabled={!name.trim()}>
                醒来
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Ending Modal (data-driven, zero if/else) ──
function EndingModal() {
  const { endingType, resetGame, clearSave } = useGameStore()
  if (!endingType) return null

  const ending = ENDINGS.find((e) => e.id === endingType)
  if (!ending) return null
  const meta = ENDING_TYPE_MAP[ending.type] ?? ENDING_TYPE_MAP.NE

  return (
    <AnimatePresence>
      <motion.div className={`${P}-ending-overlay`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className={`${P}-ending-modal`}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{meta.icon}</div>
          <div style={{
            display: 'inline-block', padding: '4px 16px', borderRadius: 20,
            background: `${meta.color}20`, color: meta.color,
            fontSize: 12, fontWeight: 600, letterSpacing: 2, marginBottom: 16,
          }}>
            {meta.label}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: 2, color: 'var(--text-primary)' }}>
            {ending.name}
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 24 }}>
            {ending.description}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className={`${P}-create-start`} onClick={() => { clearSave(); resetGame() }} style={{ fontSize: 13, padding: '10px 24px' }}>
              返回标题
            </button>
            <button className={`${P}-continue-btn`} onClick={() => useGameStore.setState({ endingType: null })} style={{ fontSize: 13 }}>
              继续探索
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}


// ── App Root ──
export default function App() {
  const { gameStarted } = useGameStore()

  if (!gameStarted) return <StartScreen />

  return (
    <>
      <AppShell />
      <EndingModal />
    </>
  )
}
