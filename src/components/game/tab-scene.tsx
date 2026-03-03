/**
 * [INPUT]: store.ts (useGameStore, SCENES)
 * [OUTPUT]: 场景Tab — 当前场景横幅 + 2列场景网格 + SceneDetail全屏overlay
 * [POS]: 三Tab之一，AppShell 路由渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, SCENES } from '../../lib/store'

const P = 'qw'

// ── Scene Detail (overlay + sheet pattern) ──────────

function SceneDetail({
  sceneId,
  onClose,
}: {
  sceneId: string
  onClose: () => void
}) {
  const scene = SCENES[sceneId]
  const currentScene = useGameStore((s) => s.currentScene)
  const selectScene = useGameStore((s) => s.selectScene)
  const isCurrent = sceneId === currentScene

  if (!scene) return null

  return (
    <>
      <motion.div
        className={`${P}-dossier-overlay`}
        style={{ background: 'rgba(0,0,0,0.5)', overflow: 'visible' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={`${P}-record-sheet`}
        style={{ zIndex: 52, overflowY: 'auto' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button className={`${P}-dossier-close`} onClick={onClose}>✕</button>

        {/* Scene Image */}
        <div className={`${P}-dossier-portrait`}>
          <img
            src={scene.background}
            alt={scene.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className={`${P}-dossier-portrait-fade`} />
        </div>

        {/* Info */}
        <div className={`${P}-dossier-content`}>
          <div className={`${P}-dossier-name`}>
            {scene.icon} {scene.name}
            {isCurrent && (
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 10, marginLeft: 8,
                background: 'var(--accent)', color: '#fff', fontWeight: 600,
                verticalAlign: 'middle',
              }}>
                当前
              </span>
            )}
          </div>

          {/* Atmosphere */}
          <div style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 12,
            background: 'rgba(158,27,50,0.1)', color: 'var(--accent)',
            fontSize: 12, fontWeight: 600, marginBottom: 12, marginTop: 8,
          }}>
            {scene.atmosphere}
          </div>

          {/* Description */}
          <div className={`${P}-dossier-section`}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{scene.description}</p>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {scene.tags.map((tag) => (
              <span key={tag} className={`${P}-dossier-tag`}>
                {tag}
              </span>
            ))}
          </div>

          {/* Move button */}
          {!isCurrent && (
            <button
              onClick={() => {
                selectScene(sceneId)
                onClose()
              }}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 12,
                background: 'var(--accent)', color: '#fff',
                border: 'none', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              移动到此场景
            </button>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ── Main Component ──────────────────────────────────

export default function TabScene() {
  const currentScene = useGameStore((s) => s.currentScene)
  const unlockedScenes = useGameStore((s) => s.unlockedScenes)

  const [detailScene, setDetailScene] = useState<string | null>(null)

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflow: 'auto', padding: 12 }}>
      {/* ── 当前场景 ── */}
      {SCENES[currentScene] && (
        <>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
            📍 当前位置
          </h4>
          <button
            onClick={() => setDetailScene(currentScene)}
            style={{
              width: '100%', borderRadius: 16, overflow: 'hidden',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              cursor: 'pointer', marginBottom: 20, padding: 0,
            }}
          >
            <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
              <img
                src={SCENES[currentScene].background}
                alt={SCENES[currentScene].name}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '20px 12px 8px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
              }}>
                <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
                  {SCENES[currentScene].icon} {SCENES[currentScene].name}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginLeft: 8 }}>
                  {SCENES[currentScene].atmosphere}
                </span>
              </div>
            </div>
          </button>
        </>
      )}

      {/* ── 场景网格 (2列) ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        🗺️ 别墅地点
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {Object.values(SCENES).map((s) => {
          const locked = !unlockedScenes.includes(s.id)
          const active = s.id === currentScene

          return (
            <button
              key={s.id}
              onClick={() => !locked && setDetailScene(s.id)}
              disabled={locked}
              style={{
                display: 'flex', flexDirection: 'column',
                borderRadius: 12, overflow: 'hidden',
                background: 'var(--bg-card)',
                border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.4 : 1,
                padding: 0,
                transition: 'all 0.2s',
              }}
            >
              {/* Scene thumbnail */}
              <div style={{ height: 80, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={s.background}
                  alt={s.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {locked && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.4)',
                    fontSize: 20,
                  }}>
                    🔒
                  </div>
                )}
                {active && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    fontSize: 9, padding: '1px 6px', borderRadius: 8,
                    background: 'var(--accent)', color: '#fff', fontWeight: 600,
                  }}>
                    当前
                  </span>
                )}
              </div>
              {/* Scene info */}
              <div style={{ padding: '6px 8px', textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {s.icon} {s.name}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--text-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {s.tags.join(' \u00B7 ')}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ height: 16 }} />

      {/* ── Scene Detail Overlay ── */}
      <AnimatePresence>
        {detailScene && SCENES[detailScene] && (
          <SceneDetail
            sceneId={detailScene}
            onClose={() => setDetailScene(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
