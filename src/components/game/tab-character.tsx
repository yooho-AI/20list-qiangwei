/**
 * [INPUT]: store.ts (useGameStore, getStatLevel, getAvailableCharacters)
 * [OUTPUT]: 人物Tab — 2x2角色网格 + SVG关系图 + CharacterDossier档案 + CharacterChat私聊
 * [POS]: 三Tab之一，AppShell 路由渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatCircleDots, Heart, MagnifyingGlass, MaskHappy, Eye, CaretDown, CaretUp, X } from '@phosphor-icons/react'
import { useGameStore, getStatLevel, getAvailableCharacters } from '../../lib/store'
import CharacterChat from './character-chat'

const P = 'qw'

// ── SVG Relation Graph ────────────────────────────────

function RelationGraph({ onNodeClick }: { onNodeClick: (id: string) => void }) {
  const { characters, characterStats, currentDay } = useGameStore()
  const available = getAvailableCharacters(currentDay, characters)
  const entries = Object.entries(available)
  const W = 380, H = 300, CX = W / 2, CY = H / 2, R = 105, NR = 22

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <circle cx={CX} cy={CY} r={28} fill="rgba(158,27,50,0.12)" stroke="var(--accent)" strokeWidth={2} />
      <text x={CX} y={CY + 5} textAnchor="middle" fill="var(--accent)" fontSize={14} fontWeight={700}>我</text>
      {entries.map(([id, char], i) => {
        const a = (2 * Math.PI * i / entries.length) - Math.PI / 2
        const x = CX + R * Math.cos(a), y = CY + R * Math.sin(a)
        const sv = characterStats[id]?.[char.statMetas[0]?.key] ?? 0
        const lv = getStatLevel(sv)
        return (
          <g key={id} onClick={() => onNodeClick(id)} style={{ cursor: 'pointer' }}>
            <line x1={CX} y1={CY} x2={x} y2={y} stroke={lv.color} strokeWidth={1.5} strokeOpacity={0.4} />
            <text x={(CX + x) / 2} y={(CY + y) / 2 - 6} textAnchor="middle" fill={lv.color} fontSize={8} fontWeight={500}>{lv.name}</text>
            <circle cx={x} cy={y} r={NR} fill="rgba(0,0,0,0.4)" stroke={char.themeColor} strokeWidth={2} />
            <clipPath id={`clip-${id}`}><circle cx={x} cy={y} r={NR - 2} /></clipPath>
            <image href={char.portrait} x={x - NR + 2} y={y - NR + 2} width={(NR - 2) * 2} height={(NR - 2) * 2}
              clipPath={`url(#clip-${id})`} preserveAspectRatio="xMidYMid slice" />
            <text x={x} y={y + NR + 12} textAnchor="middle" fill="var(--text-primary)" fontSize={10} fontWeight={500}>{char.name}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── CharacterDossier (overlay + sheet pattern) ────────

function CharacterDossier({ charId, onClose }: { charId: string; onClose: () => void }) {
  const { characters, characterStats } = useGameStore()
  const [expanded, setExpanded] = useState(false)
  const char = characters[charId]
  const stats = characterStats[charId] ?? {}
  if (!char) return null

  const mainStat = char.statMetas[0]
  const mainVal = stats[mainStat?.key] ?? 0
  const level = getStatLevel(mainVal)

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
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        <div className={`${P}-dossier-portrait`}>
          <motion.img src={char.portrait} alt={char.name}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div className={`${P}-dossier-portrait-fade`} />
          <button className={`${P}-dossier-close`} onClick={onClose}><X size={20} weight="bold" /></button>
        </div>
        <div className={`${P}-dossier-content`}>
          <div className={`${P}-dossier-name`} style={{ color: char.themeColor }}>{char.name}</div>
          <div className={`${P}-dossier-title-text`}>{char.title}</div>
          <div className={`${P}-dossier-desc`}>{char.description}</div>
          <div className={`${P}-dossier-tags`}>
            <span className={`${P}-dossier-tag`}>{char.gender === 'male' ? '\u2642' : '\u2640'} {char.age}</span>
            <span className={`${P}-dossier-tag`} style={{ color: level.color }}>{level.name}</span>
            <span className={`${P}-dossier-tag`}>{char.personality}</span>
          </div>

          <div className={`${P}-dossier-section`}>
            <div className={`${P}-dossier-section-title`}><Heart size={14} weight="fill" /> {mainStat?.label ?? '好感'}数据</div>
            {char.statMetas.map((meta, i) => {
              const value = stats[meta.key] ?? 0
              return (
                <div key={meta.key} className={`${P}-stat-bar`}>
                  <div className={`${P}-stat-bar-label`}><span>{meta.icon}</span><span>{meta.label}</span></div>
                  <div className={`${P}-stat-bar-track`}>
                    <motion.div className={`${P}-stat-bar-fill`} style={{ background: meta.color }}
                      initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }} />
                  </div>
                  <div className={`${P}-stat-bar-value`} style={{ color: meta.color }}>{value}</div>
                </div>
              )
            })}
          </div>

          <div className={`${P}-dossier-section`}>
            <div className={`${P}-dossier-section-title`}><MagnifyingGlass size={14} weight="fill" /> 隐藏秘密</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {mainVal >= 60 ? char.secret : '???（需要更深入地了解此人）'}
            </p>
          </div>

          <div className={`${P}-dossier-section`}>
            <div className={`${P}-dossier-expandable`} onClick={() => setExpanded(!expanded)}>
              <div className={`${P}-dossier-section-title`}>
                <MaskHappy size={14} weight="fill" /> 性格分析 {expanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
              </div>
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.div className={`${P}-dossier-expandable-content`}
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{char.personality}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{char.speakingStyle}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{char.behaviorPatterns}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={`${P}-dossier-section`}>
            <div className={`${P}-dossier-section-title`}><Eye size={14} weight="fill" /> 接近提示</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              {char.triggerPoints.slice(0, 3).map((tp, i) => <div key={i}>- {tp}</div>)}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── TabCharacter ──────────────────────────────────────

export default function TabCharacter() {
  const { characters, characterStats, currentDay } = useGameStore()
  const [dossierCharId, setDossierCharId] = useState<string | null>(null)
  const [chatChar, setChatChar] = useState<string | null>(null)

  const available = getAvailableCharacters(currentDay, characters)

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflowY: 'auto', padding: 12 }}>
      {/* ── 角色网格 (2x2) ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        👥 人物一览
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {Object.entries(available).map(([id, char]) => {
          const cStats = characterStats[id] ?? {}
          const mm = char.statMetas[0]
          const mv = cStats[mm?.key] ?? 0
          const level = getStatLevel(mv)
          return (
            <button
              key={id}
              onClick={() => setDossierCharId(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: 10, borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {/* 聊天按钮 */}
              <div
                onClick={(e) => { e.stopPropagation(); setChatChar(id) }}
                style={{
                  position: 'absolute', top: 6, left: 6,
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${char.themeColor}18`,
                  border: `1px solid ${char.themeColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 1,
                }}
              >
                <ChatCircleDots size={16} weight="fill" color={char.themeColor} />
              </div>
              <img
                src={char.portrait}
                alt={char.name}
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  objectFit: 'cover', objectPosition: 'center top',
                  border: `2px solid ${char.themeColor}44`,
                  marginBottom: 6,
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: char.themeColor }}>
                {char.name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {char.title}
              </span>
              {/* Mini affection bar */}
              <div style={{ width: '80%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: char.themeColor,
                  width: `${mv}%`, transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                {level.name} {mv}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 关系图 ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        🔗 关系网络
      </h4>
      <div style={{
        padding: 8, borderRadius: 12, background: 'rgba(158,27,50,0.03)',
        border: '1px solid var(--border)', marginBottom: 20,
      }}>
        <RelationGraph onNodeClick={(id) => setDossierCharId(id)} />
      </div>

      <div style={{ height: 16 }} />

      {/* ── Character Dossier ── */}
      <AnimatePresence>
        {dossierCharId && <CharacterDossier charId={dossierCharId} onClose={() => setDossierCharId(null)} />}
      </AnimatePresence>

      {/* ── Character Chat ── */}
      <AnimatePresence>
        {chatChar && characters[chatChar] && (
          <CharacterChat
            charId={chatChar}
            onClose={() => setChatChar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
