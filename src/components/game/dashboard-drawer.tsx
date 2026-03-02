/**
 * [INPUT]: store.ts (useGameStore)
 * [OUTPUT]: 囚笼手记抽屉 — 扉页 + 好感速览 + 场景网格 + 目标 + 属性 + 背包
 * [POS]: 左侧滑入抽屉，Reorder 拖拽排序
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import {
  Heart, MapTrifold, Target, ShieldCheck, Backpack,
  DotsSixVertical, Lock, Lightning,
} from '@phosphor-icons/react'
import {
  useGameStore, PERIODS, SCENES, ITEMS, PLAYER_STAT_METAS,
  getCurrentChapter, MAX_DAYS, MAX_ACTION_POINTS,
} from '../../lib/store'

const P = 'qw'
const ORDER_KEY = 'qw-dash-order'

const DEFAULT_SECTIONS = ['affinity', 'scenes', 'objectives', 'stats', 'items']

// ── Draggable Section Wrapper ──

function DraggableSection({
  id,
  title,
  icon,
  children,
}: {
  id: string
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item value={id} dragListener={false} dragControls={controls}>
      <div className={`${P}-dash-section`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className={`${P}-dash-section-title`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon} {title}
          </div>
          <div
            className={`${P}-dash-drag-handle`}
            onPointerDown={(e) => controls.start(e)}
          >
            <DotsSixVertical size={16} weight="bold" />
          </div>
        </div>
        {children}
      </div>
    </Reorder.Item>
  )
}

// ── Dashboard Drawer ──

export default function DashboardDrawer() {
  const {
    playerName, currentDay, currentPeriodIndex, actionPoints,
    characters, characterStats, playerStats,
    unlockedScenes, inventory,
    selectScene,
  } = useGameStore()

  const chapter = getCurrentChapter(currentDay)
  const period = PERIODS[currentPeriodIndex]

  // Section order persistence
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ORDER_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_SECTIONS
    } catch {
      return DEFAULT_SECTIONS
    }
  })

  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(sectionOrder))
  }, [sectionOrder])

  // Sort 3 brothers by affection descending (exclude laozhao)
  const brothers = Object.entries(characters)
    .filter(([id]) => id !== 'laozhao')
    .map(([id, char]) => ({
      id,
      char,
      stats: characterStats[id] ?? {},
    }))
    .sort((a, b) => (b.stats.affection ?? 0) - (a.stats.affection ?? 0))

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'affinity':
        return (
          <DraggableSection key={sectionId} id={sectionId} title="好感速览" icon={<Heart size={14} weight="fill" />}>
            {brothers.map(({ id, char, stats }) => (
              <div key={id} className={`${P}-dash-affection-item`}>
                <img
                  className={`${P}-dash-affection-avatar`}
                  src={char.portrait}
                  alt={char.name}
                  style={{ borderColor: char.themeColor }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className={`${P}-dash-affection-info`}>
                  <div className={`${P}-dash-affection-name`} style={{ color: char.themeColor }}>
                    {char.name}
                  </div>
                  <div className={`${P}-dash-affection-bar`}>
                    <div
                      className={`${P}-dash-affection-fill`}
                      style={{
                        width: `${stats.affection ?? 0}%`,
                        background: char.themeColor,
                      }}
                    />
                  </div>
                </div>
                <div className={`${P}-dash-affection-value`}>{stats.affection ?? 0}</div>
              </div>
            ))}
          </DraggableSection>
        )

      case 'scenes':
        return (
          <DraggableSection key={sectionId} id={sectionId} title="别墅地图" icon={<MapTrifold size={14} weight="fill" />}>
            <div className={`${P}-dash-scene-grid`}>
              {Object.values(SCENES).map((scene) => {
                const unlocked = unlockedScenes.includes(scene.id)
                return (
                  <div
                    key={scene.id}
                    className={`${P}-dash-scene-thumb ${unlocked ? '' : 'locked'}`}
                    onClick={() => unlocked && selectScene(scene.id)}
                  >
                    <img
                      src={scene.background}
                      alt={scene.name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className={`${P}-dash-scene-name`}>
                      {unlocked ? scene.name : <Lock size={14} weight="bold" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </DraggableSection>
        )

      case 'objectives':
        return (
          <DraggableSection key={sectionId} id={sectionId} title="当前目标" icon={<Target size={14} weight="fill" />}>
            {chapter.objectives.map((obj, i) => (
              <div key={i} className={`${P}-dash-objective`}>
                <div className={`${P}-dash-objective-check`} />
                <span>{obj}</span>
              </div>
            ))}
          </DraggableSection>
        )

      case 'stats':
        return (
          <DraggableSection key={sectionId} id={sectionId} title="个人属性" icon={<ShieldCheck size={14} weight="fill" />}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {PLAYER_STAT_METAS.map((meta) => (
                <div key={meta.key} className={`${P}-dash-stat-pill`}>
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span className={`${P}-dash-stat-pill-value`} style={{ color: meta.color }}>
                    {playerStats[meta.key as keyof typeof playerStats] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </DraggableSection>
        )

      case 'items':
        return (
          <DraggableSection key={sectionId} id={sectionId} title="背包" icon={<Backpack size={14} weight="fill" />}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(ITEMS).map(([itemId, item]) => {
                const count = inventory[itemId] ?? 0
                return (
                  <div
                    key={itemId}
                    className={`${P}-dash-stat-pill`}
                    style={{ opacity: count > 0 ? 1 : 0.3 }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                    <span className={`${P}-dash-stat-pill-value`}>x{count}</span>
                  </div>
                )
              })}
            </div>
          </DraggableSection>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Fixed Front Page */}
      <div className={`${P}-dash-header`}>
        <div className={`${P}-dash-title`}>
          <Lock size={18} weight="fill" style={{ marginRight: 6, verticalAlign: -2 }} />
          囚笼手记
        </div>
        <div className={`${P}-dash-meta`}>
          {playerName} · 第{currentDay}/{MAX_DAYS}天 · {period?.icon} {period?.name}
        </div>
        <div className={`${P}-dash-meta`} style={{ marginTop: 4 }}>
          第{chapter.id}章「{chapter.name}」 · <Lightning size={12} weight="fill" style={{ verticalAlign: -1 }} /> {actionPoints}/{MAX_ACTION_POINTS} AP
        </div>
      </div>

      {/* Scrollable Reorderable Sections */}
      <div className={`${P}-dash-scroll ${P}-scrollbar`}>
        <Reorder.Group
          axis="y"
          values={sectionOrder}
          onReorder={setSectionOrder}
          style={{ listStyle: 'none', padding: 0 }}
        >
          {sectionOrder.map(renderSection)}
        </Reorder.Group>
      </div>
    </>
  )
}
