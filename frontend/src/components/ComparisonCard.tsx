import { useEffect, useState } from 'react'
import type { AlgorithmComparisonResult } from '../types'

// 算法显示名:与 AlgorithmModal / StatsPanel 保持一致
const ALGORITHM_LABELS: Record<string, { emoji: string; label: string }> = {
  nearest_neighbor: { emoji: '🚚', label: 'Nearest Neighbor' },
  savings: { emoji: '🔗', label: 'Savings Algorithm' },
  gurobi: { emoji: '🧮', label: 'Gurobi' },
}

function getLabel(name: string): { emoji: string; label: string } {
  return ALGORITHM_LABELS[name] ?? { emoji: '⚙️', label: name }
}

interface ComparisonCardProps {
  results: AlgorithmComparisonResult[]
  onClose: () => void
}

// 算法对比结果弹窗:覆盖在地图正中央,不影响右侧控制面板
// 展示各算法的车辆数 / 总距离 / 耗时,并推荐距离最短的方案
function ComparisonCard({ results, onClose }: ComparisonCardProps) {
  // leaving 状态:关闭时先淡出再卸载
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    setLeaving(true)
    setTimeout(onClose, 250)
  }

  // 推荐方案:总距离最短(且 vehicle_count > 0 表示有可行解)
  const best = results.reduce<AlgorithmComparisonResult | null>((acc, r) => {
    if (r.vehicle_count === 0) return acc
    if (!acc || r.total_distance < acc.total_distance) return r
    return acc
  }, null)

  return (
    <div
      className={`comparison-overlay ${leaving ? 'leaving' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`comparison-card ${leaving ? 'leaving' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="comparison-title">📊 算法优化结果对比</h2>

        <div className="comparison-list">
          {results.map((r, i) => {
            const { emoji, label } = getLabel(r.algorithm)
            const isBest = best !== null && r.algorithm === best.algorithm
            return (
              <div key={r.algorithm} className={`comparison-item ${i > 0 ? 'with-top-border' : ''}`}>
                <div className="comparison-item-header">
                  <span className="comparison-algo-emoji">{emoji}</span>
                  <span className="comparison-algo-name">{label}</span>
                  {isBest && <span className="comparison-badge">推荐</span>}
                </div>
                <div className="comparison-metrics">
                  <div className="comparison-metric">
                    <span className="metric-label">车辆数量</span>
                    <span className="metric-value">{r.vehicle_count} 辆</span>
                  </div>
                  <div className="comparison-metric">
                    <span className="metric-label">总配送距离</span>
                    <span className="metric-value">{r.total_distance.toFixed(2)} km</span>
                  </div>
                  <div className="comparison-metric">
                    <span className="metric-label">计算时间</span>
                    <span className="metric-value">{r.solve_time} ms</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {best && (
          <div className="comparison-summary">
            <div className="summary-label">推荐方案</div>
            <div className="summary-algo">
              {getLabel(best.algorithm).emoji} {getLabel(best.algorithm).label}
            </div>
            <div className="summary-reason">
              路线距离更短，减少配送成本。
            </div>
          </div>
        )}

        <button className="comparison-close-btn" onClick={handleClose}>
          关闭
        </button>
      </div>
    </div>
  )
}

export default ComparisonCard
