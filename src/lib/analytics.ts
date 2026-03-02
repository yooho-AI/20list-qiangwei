/**
 * [INPUT]: window.umami (外部脚本)
 * [OUTPUT]: 事件埋点函数
 * [POS]: lib 的 Umami 埋点模块，被 App.tsx 和 store.ts 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Record<string, unknown>) => void }
  }
}

const PREFIX = 'qw_'

function trackEvent(name: string, data?: Record<string, unknown>) {
  try { window.umami?.track(`${PREFIX}${name}`, data) } catch { /* silent */ }
}

export function trackGameStart() { trackEvent('game_start') }
export function trackGameContinue() { trackEvent('game_continue') }
export function trackPlayerCreate(name: string) { trackEvent('player_create', { name }) }
export function trackTimeAdvance(day: number, period: string) { trackEvent('time_advance', { day, period }) }
export function trackChapterEnter(chapter: string) { trackEvent('chapter_enter', { chapter }) }
export function trackEndingReached(ending: string) { trackEvent('ending_reached', { ending }) }
export function trackSceneUnlock(scene: string) { trackEvent('scene_unlock', { scene }) }
export function trackMentalCrisis() { trackEvent('mental_crisis') }
