import { useState } from 'react'
import type { Scene } from '../types'
import CoverPhase from '../components/home/CoverPhase'
import StoryPhase from '../components/home/StoryPhase'
import LoadingPhase from '../components/home/LoadingPhase'

interface HomeProps {
  onStart: (scene: Scene) => void
}

// Home:XATU Campus VRP Simulator 启动界面
// 三阶段状态机(均在首页内部完成,不改变现有路由结构):
//   cover   封面:虚化校园背景 + 标题 + "开始配送"
//   story   故事引入:配送任务文案逐条浮现
//   loading 系统初始化:三个加载步骤依次完成后进入 Simulation
// 背景层与遮罩层在 Home 层级常驻,阶段切换时背景保持固定不闪动。
type Phase = 'cover' | 'story' | 'loading'

function Home({ onStart }: HomeProps) {
  const [phase, setPhase] = useState<Phase>('cover')

  // loading 阶段完成后才真正进入现有仿真页(路由逻辑不变)
  function handleEnterSimulation() {
    onStart('xatu-campus')
  }

  return (
    <div className={`home-page home-page--${phase}`}>
      {/* 共享背景:cover 即轻微虚化,之后保持固定 */}
      <div className="home-bg" />
      {/* 黑色半透明遮罩:阶段加深以聚焦文字 */}
      <div className="home-overlay" />

      {/* 阶段内容层:key 随阶段变化,触发挂载淡入动画 */}
      <div className="home-stage">
        {phase === 'cover' && (
          <CoverPhase onStart={() => setPhase('story')} />
        )}
        {phase === 'story' && (
          <StoryPhase onComplete={() => setPhase('loading')} />
        )}
        {phase === 'loading' && (
          <LoadingPhase onComplete={handleEnterSimulation} />
        )}
      </div>
    </div>
  )
}

export default Home
