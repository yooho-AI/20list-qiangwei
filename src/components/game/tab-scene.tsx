/**
 * [INPUT]: store.ts (useGameStore, SCENES)
 * [OUTPUT]: 场景Tab — 9:16大图 + 渐变遮罩 + 地点列表(2列网格)
 * [POS]: 三Tab之一，AppShell 路由渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Lock, LockOpen, MapPin, NavigationArrow } from '@phosphor-icons/react'
import {
  useGameStore, SCENES,
} from '../../lib/store'

const P = 'qw'

function isSceneUnlockable(
  sceneId: string,
  currentDay: number,
  characterStats: Record<string, Record<string, number>>,
): boolean {
  const scene = SCENES[sceneId]
  if (!scene?.unlockCondition) return true
  const { day, stat } = scene.unlockCondition
  if (day && currentDay < day) return false
  if (stat) {
    const val = characterStats[stat.charId]?.[stat.key] ?? 0
    if (val < stat.min) return false
  }
  return true
}

export default function TabScene() {
  const {
    currentScene, unlockedScenes, characterStats, currentDay,
    selectScene,
  } = useGameStore()

  const scene = SCENES[currentScene]

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflowY: 'auto' }}>
      {/* Scene Hero */}
      {scene && (
        <div className={`${P}-scene-hero`}>
          <img
            src={scene.background}
            alt={scene.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className={`${P}-scene-hero-overlay`}>
            <div className={`${P}-scene-hero-icon`}>{scene.icon}</div>
            <div className={`${P}-scene-hero-name`}>{scene.name}</div>
            <div className={`${P}-scene-hero-desc`}>{scene.atmosphere}</div>
          </div>
        </div>
      )}

      {/* Location List */}
      <div style={{ padding: '16px 12px' }}>
        <div className={`${P}-neon-divider`} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={16} weight="fill" /> 别墅地点
        </div>
        <div className={`${P}-location-grid`}>
          {Object.values(SCENES).map((s) => {
            const unlocked = unlockedScenes.includes(s.id)
            const canUnlock = !unlocked && isSceneUnlockable(s.id, currentDay, characterStats)
            const isCurrent = s.id === currentScene
            return (
              <button
                key={s.id}
                className={`${P}-location-item ${isCurrent ? 'current' : ''} ${!unlocked ? 'locked' : ''}`}
                onClick={() => unlocked && selectScene(s.id)}
                disabled={!unlocked}
              >
                <div className={`${P}-location-icon`}>
                  {unlocked
                    ? s.icon
                    : canUnlock
                      ? <LockOpen size={20} weight="duotone" />
                      : <Lock size={20} weight="duotone" />
                  }
                </div>
                <div className={`${P}-location-name`}>{unlocked ? s.name : '???'}</div>
                <div className={`${P}-location-status`}>
                  {isCurrent
                    ? <><NavigationArrow size={12} weight="fill" /> 当前</>
                    : unlocked ? '可前往' : '未解锁'}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
