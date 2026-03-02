/**
 * [INPUT]: store.ts (useGameStore, ENDINGS), analytics, bgm
 * [OUTPUT]: Root component: 3-phase opening (awakening -> letter -> name) + GameScreen + EndingModal + MenuOverlay
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

// ── Floating Particles ──
function FloatingParticles({ count = 20 }: { count?: number }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 4,
    size: 2 + Math.random() * 4,
    opacity: 0.3 + Math.random() * 0.5,
  })), [count])

  return (
    <div className={`${P}-particles`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`${P}-particle`}
          style={{ left: p.left, width: p.size, height: p.size, opacity: 0 }}
          animate={{ y: [0, -120 - Math.random() * 80], opacity: [0, p.opacity, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ── Start Screen (3-phase opening) ──
function StartScreen() {
  const { setPlayerInfo, initGame, loadGame, hasSave } = useGameStore()
  const { toggle: toggleBgm, isPlaying } = useBgm()
  const saved = hasSave()
  const [phase, setPhase] = useState<'awaken' | 'letter' | 'name'>('awaken')
  const [name, setName] = useState('苏念')
  const [awakenStep, setAwakenStep] = useState(0)

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
  }, [name, setPlayerInfo, initGame])

  return (
    <div className={`${P}-start`}>
      <AnimatePresence mode="wait">
        {/* ── Phase 1: Awakening ── */}
        {phase === 'awaken' && (
          <motion.div key="awaken" className={`${P}-awaken-scene`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}>
            <FloatingParticles count={24} />
            <AnimatePresence>
              {awakenStep >= 1 && (
                <motion.p className={`${P}-awaken-text`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
                  你的意识逐渐清醒...
                </motion.p>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {awakenStep >= 2 && (
                <motion.div className={`${P}-awaken-title`}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2 }}>
                  <h1 className={`${P}-title`}>蔷薇牢笼</h1>
                  <p className={`${P}-subtitle`}>被囚禁的第三十天</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {awakenStep >= 3 && (
                <motion.div className={`${P}-start-cta`}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}>
                  <button className={`${P}-start-btn`} onClick={handleStart}>睁开眼</button>
                  {saved && (
                    <button className={`${P}-continue-btn`} onClick={handleContinue}>继续上次</button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`${P}-music-bar`} onClick={toggleBgm}>
              <span>♪</span>
              <span>{isPlaying ? '播放中' : '点击播放'}</span>
            </div>
          </motion.div>
        )}

        {/* ── Phase 2: Letter / Note ── */}
        {phase === 'letter' && (
          <motion.div key="letter" className={`${P}-letter-scene`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}>
            <FloatingParticles count={12} />
            <motion.div className={`${P}-letter-card`}
              initial={{ opacity: 0, scale: 0.92, rotateX: 8 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ delay: 0.3, duration: 1.0 }}>
              <div className={`${P}-letter-text`}>别怕，哥哥们会照顾好你的。</div>
              <div className={`${P}-letter-ornament`} />
            </motion.div>
            <motion.button className={`${P}-skip-btn`}
              onClick={() => setPhase('name')}
              initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 1.5 }}>
              跳过 ›
            </motion.button>
          </motion.div>
        )}

        {/* ── Phase 3: Name Input ── */}
        {phase === 'name' && (
          <motion.div key="name" className={`${P}-name-scene`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}>
            <FloatingParticles count={8} />
            <motion.div className={`${P}-name-form`}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}>
              <div className={`${P}-name-label`}>你的名字</div>
              <input className={`${P}-name-input`} type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入角色名" maxLength={8} autoFocus />
              <div className={`${P}-name-hint`}>默认：苏念</div>
              <div className={`${P}-name-actions`}>
                <button className={`${P}-start-btn`} onClick={handleBegin}>醒来</button>
                <button className={`${P}-continue-btn`} onClick={() => setPhase('awaken')}>返回</button>
              </div>
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
            <button className={`${P}-start-btn`} onClick={() => { clearSave(); resetGame() }} style={{ fontSize: 13 }}>
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
