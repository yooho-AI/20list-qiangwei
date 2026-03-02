/**
 * [INPUT]: store.ts (useGameStore, PLAYER_STAT_METAS, getStatLevel)
 * [OUTPUT]: 人物Tab — 立绘 + 属性条 + SVG关系图 + 角色网格 + 全屏档案
 * [POS]: 三Tab之一，AppShell 路由渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShieldCheck, Eye, MaskHappy, MagnifyingGlass, X, CaretDown, CaretUp, UserCircle, Users } from '@phosphor-icons/react'
import { useGameStore, PLAYER_STAT_METAS, getStatLevel } from '../../lib/store'

const P = 'qw'
const STAT_ICONS: Record<string, React.ReactNode> = {
  stamina: <Heart size={14} weight="fill" />, mental: <ShieldCheck size={14} weight="fill" />,
  alertness: <Eye size={14} weight="fill" />, disguise: <MaskHappy size={14} weight="fill" />,
  clues: <MagnifyingGlass size={14} weight="fill" />,
}

function StatBar({ icon, label, value, color, delay = 0 }: {
  icon: React.ReactNode; label: string; value: number; color: string; delay?: number
}) {
  return (
    <div className={`${P}-stat-bar`}>
      <div className={`${P}-stat-bar-label`}><span>{icon}</span><span>{label}</span></div>
      <div className={`${P}-stat-bar-track`}>
        <motion.div className={`${P}-stat-bar-fill`} style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay }} />
      </div>
      <div className={`${P}-stat-bar-value`} style={{ color }}>{value}</div>
    </div>
  )
}

function RelationGraph() {
  const { characters, characterStats, selectCharacter, setActiveTab } = useGameStore()
  const entries = Object.entries(characters)
  const W = 380, H = 300, CX = W / 2, CY = H / 2, R = 105, NR = 22

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`${P}-relation-graph`}>
      <circle cx={CX} cy={CY} r={28} fill="rgba(255,77,141,0.12)" stroke="var(--accent)" strokeWidth={2} />
      <text x={CX} y={CY + 5} textAnchor="middle" fill="var(--accent)" fontSize={14} fontWeight={700}>我</text>
      {entries.map(([id, char], i) => {
        const a = (2 * Math.PI * i / entries.length) - Math.PI / 2
        const x = CX + R * Math.cos(a), y = CY + R * Math.sin(a)
        const sv = characterStats[id]?.[char.statMetas[0]?.key] ?? 0
        const lv = getStatLevel(sv)
        return (
          <g key={id} onClick={() => { selectCharacter(id); setActiveTab('character') }} style={{ cursor: 'pointer' }}>
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
    <motion.div className={`${P}-dossier-overlay`}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}>
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
          <span className={`${P}-dossier-tag`}>{char.gender === 'male' ? '♂' : '♀'} {char.age}</span>
          <span className={`${P}-dossier-tag`} style={{ color: level.color }}>{level.name}</span>
          <span className={`${P}-dossier-tag`}>{char.personality}</span>
        </div>

        <div className={`${P}-dossier-section`}>
          <div className={`${P}-dossier-section-title`}><Heart size={14} weight="fill" /> {mainStat?.label ?? '好感'}数据</div>
          {char.statMetas.map((meta, i) => (
            <StatBar key={meta.key} icon={meta.icon} label={meta.label}
              value={stats[meta.key] ?? 0} color={meta.color} delay={i * 0.1} />
          ))}
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
  )
}

export default function TabCharacter() {
  const { currentCharacter, characters, characterStats, playerStats, selectCharacter, setActiveTab } = useGameStore()
  const [dossierCharId, setDossierCharId] = useState<string | null>(null)
  const char = currentCharacter ? characters[currentCharacter] : null
  const stats = currentCharacter ? (characterStats[currentCharacter] ?? {}) : {}

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflowY: 'auto' }}>
      {char ? (
        <div className={`${P}-portrait-hero`} onClick={() => setDossierCharId(char.id)}>
          <img src={char.portrait} alt={char.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div className={`${P}-portrait-hero-overlay`}>
            <div style={{ fontSize: 20, fontWeight: 700, color: char.themeColor, letterSpacing: 2 }}>{char.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{char.title}</div>
          </div>
        </div>
      ) : (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <UserCircle size={40} weight="thin" style={{ opacity: 0.4, margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>选择一位角色查看详情</div>
        </div>
      )}

      {char && (
        <div style={{ padding: '0 12px' }}>
          {char.statMetas.map((meta, i) => (
            <StatBar key={meta.key} icon={meta.icon} label={meta.label}
              value={stats[meta.key] ?? 0} color={meta.color} delay={i * 0.1} />
          ))}
        </div>
      )}

      <div style={{ padding: '12px 12px 0' }}>
        <div className={`${P}-neon-divider`} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={16} weight="fill" /> 我的状态
        </div>
        {PLAYER_STAT_METAS.map((meta, i) => (
          <StatBar key={meta.key} icon={STAT_ICONS[meta.key] ?? meta.icon} label={meta.label}
            value={playerStats[meta.key as keyof typeof playerStats] ?? 0} color={meta.color} delay={i * 0.05} />
        ))}
      </div>

      <div style={{ padding: '12px 12px 0' }}>
        <div className={`${P}-neon-divider`} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Heart size={16} weight="fill" /> 关系网
        </div>
        <RelationGraph />
      </div>

      <div style={{ padding: '12px 12px 0' }}>
        <div className={`${P}-neon-divider`} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={16} weight="fill" /> 全部角色
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Object.values(characters).map((c) => {
            const cStats = characterStats[c.id] ?? {}
            const mm = c.statMetas[0]
            const mv = cStats[mm?.key] ?? 0
            const active = c.id === currentCharacter
            return (
              <div key={c.id} className={`${P}-relation-card ${active ? 'active' : ''}`}
                onClick={() => { selectCharacter(c.id); setActiveTab('dialogue') }}
                style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px 8px' }}>
                <img className={`${P}-relation-avatar`} src={c.portrait} alt={c.name}
                  style={{ borderColor: c.themeColor, width: 48, height: 48, marginBottom: 6 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className={`${P}-relation-name`} style={{ color: c.themeColor, fontSize: 13 }}>{c.name}</div>
                <div className={`${P}-relation-label`} style={{ fontSize: 11 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: c.themeColor, marginTop: 4 }}>{mm?.icon} {mv}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ height: 24 }} />

      <AnimatePresence>
        {dossierCharId && <CharacterDossier charId={dossierCharId} onClose={() => setDossierCharId(null)} />}
      </AnimatePresence>
    </div>
  )
}
