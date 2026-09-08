import type { SolveResponse } from '../types'

interface StatsPanelProps {
  solveResult: SolveResponse | null
  solving: boolean
}

// StatsPanel:求解结果统计
// 职责:展示算法名、总距离、车辆数,空态友好提示
// 不做业务逻辑,纯展示
function StatsPanel({ solveResult, solving }: StatsPanelProps) {
  if (solving) {
    return <p className="placeholder-inline">正在求解...</p>
  }

  if (!solveResult) {
    return (
      <p className="placeholder-inline">
        选择算法并点击 Solve 后,这里将显示求解结果。
      </p>
    )
  }

  return (
    <div>
      <div className="stat-item">
        <span className="stat-label">算法</span>
        <span className="stat-value">{solveResult.algorithm}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">总距离</span>
        <span className="stat-value">
          {solveResult.total_distance.toFixed(2)}
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-label">车辆数</span>
        <span className="stat-value">{solveResult.routes.length}</span>
      </div>

      <div className="section-title" style={{ marginTop: 12 }}>
        各车辆路线
      </div>
      {solveResult.routes.map((r) => (
        <div key={r.vehicle_id} className="stat-item">
          <span className="stat-label">车辆 {r.vehicle_id}</span>
          <span className="stat-value" style={{ fontSize: 12 }}>
            {r.route.join(' → ')}
          </span>
        </div>
      ))}
    </div>
  )
}

export default StatsPanel
