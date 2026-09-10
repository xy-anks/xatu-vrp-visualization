interface CoverPhaseProps {
  onStart: () => void
}

// 阶段一:首页封面(Cover)
// 进入网站即显示已轻微虚化的校园背景(虚化与遮罩由 Home 共享层负责),
// 中央展示标题与"开始配送"按钮;元素挂载时以 CSS animation 错落淡入。
function CoverPhase({ onStart }: CoverPhaseProps) {
  return (
    <div className="home-cover">
      <h1 className="home-cover-title home-anim-up">XATU Campus</h1>
      <h2 className="home-cover-subtitle home-anim-up home-anim-d1">
        VRP Simulator
      </h2>
      <p className="home-cover-cn home-anim-up home-anim-d2">
        校园物流路径优化可视化系统
      </p>

      <button
        type="button"
        className="home-start-btn home-anim-up home-anim-d3"
        onClick={onStart}
      >
        开始配送
      </button>
    </div>
  )
}

export default CoverPhase
