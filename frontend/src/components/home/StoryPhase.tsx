import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

interface StoryPhaseProps {
  onComplete: () => void
}

// 阶段二:故事引入(Story)
// 背景保持与封面一致,文案逐条浮现;最后一句留白后自动进入加载阶段。
// 每个 beat 给出相对进入时刻(ms),组件内用单个递增计数器驱动显示,
// 计时器全部在卸载时清理。

interface Beat {
  kind: 'time' | 'line' | 'chip' | 'question'
  text: string
  at: number
}

// 故事节拍:按出现顺序排列,每两句话间隔统一 0.8 秒
const BEATS: Beat[] = [
  { kind: 'time', text: '早上 8:00', at: 300 },
  { kind: 'line', text: '校园里的配送任务开始产生', at: 1100 },
  { kind: 'chip', text: '🏠 宿舍订单', at: 1900 },
  { kind: 'chip', text: '📦 快递需求', at: 2700 },
  { kind: 'chip', text: '🚚 配送车辆', at: 3500 },
  { kind: 'line', text: '每天都有大量配送任务。', at: 4300 },
  { kind: 'question', text: '如何用更少的车辆,', at: 5100 },
  { kind: 'question', text: '更短的距离,', at: 5900 },
  { kind: 'question', text: '完成全部配送?', at: 6700 },
]

// 最后一条节拍后再留白约 2.5 秒,让高潮沉淀,然后切到加载阶段
const COMPLETE_AT = 9200

function StoryPhase({ onComplete }: StoryPhaseProps) {
  // visibleCount:已浮现的节拍条数
  const [visibleCount, setVisibleCount] = useState(0)
  // leaving:故事播放完毕,触发容器淡出动画
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timers: number[] = BEATS.map((beat, index) =>
      window.setTimeout(() => setVisibleCount(index + 1), beat.at)
    )
    // 故事播完先触发淡出,1 秒后再切到加载阶段
    timers.push(window.setTimeout(() => setLeaving(true), COMPLETE_AT))
    timers.push(window.setTimeout(onComplete, COMPLETE_AT + 1000))

    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [onComplete])

  return (
    <div className={`home-story${leaving ? ' home-story--leaving' : ''}`}>
      {BEATS.slice(0, visibleCount).map((beat, index) => (
        <p
          key={index}
          className={`home-story-beat home-story-${beat.kind}`}
          style={{ '--idx': index } as CSSProperties}
        >
          {beat.text}
        </p>
      ))}
    </div>
  )
}

export default StoryPhase
