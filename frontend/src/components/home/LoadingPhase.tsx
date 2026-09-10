import { useEffect, useState } from 'react'

interface LoadingPhaseProps {
  onComplete: () => void
}

// 阶段三:系统初始化(Loading)
// 三个初始化步骤依次执行:⟳(进行中,CSS 旋转)→ ✓(完成),
// 每步约 0.9 秒;最后一步完成后短暂停留,再进入 Simulation。
// 纯 CSS 动画,无第三方库。

const STEPS = ['加载校园地图', '创建配送节点', '等待订单生成']
const STEP_MS = 900
// 最后一步 ✓ 后的停留时间
const FINISH_HOLD_MS = 550

function LoadingPhase({ onComplete }: LoadingPhaseProps) {
  // doneCount:已完成(显示 ✓)的步骤数,0 ~ STEPS.length
  const [doneCount, setDoneCount] = useState(0)

  useEffect(() => {
    const timers: number[] = STEPS.map((_, index) =>
      // index+1 步在 (index+1)*STEP_MS 时刻完成
      window.setTimeout(() => setDoneCount(index + 1), (index + 1) * STEP_MS)
    )
    // 全部完成并停留后进入仿真页
    timers.push(
      window.setTimeout(onComplete, STEPS.length * STEP_MS + FINISH_HOLD_MS)
    )

    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [onComplete])

  return (
    <div className="home-loading">
      <p className="home-loading-title">正在初始化校园配送系统...</p>

      <ul className="home-loading-list">
        {STEPS.map((label, index) => {
          const done = index < doneCount
          const active = index === doneCount
          return (
            <li
              key={label}
              className={`home-loading-item${
                done ? ' is-done' : active ? ' is-active' : ' is-pending'
              }`}
            >
              <span className="home-loading-icon">
                {done ? '✓' : active ? '⟳' : '○'}
              </span>
              <span className="home-loading-text">{label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default LoadingPhase
