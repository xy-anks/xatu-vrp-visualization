export interface AlgorithmInfo {
  title: string
  idea: string
  pros: string[]
  cons: string[]
}

// 各算法的说明文案,按 algorithm name 匹配
// 后端返回的 algorithm name 与此处 key 对应
const ALGORITHM_INFO: Record<string, AlgorithmInfo> = {
  nearest_neighbor: {
    title: '🚚 最近邻算法',
    idea: '从配送中心出发，每次选择距离当前位置最近的未访问客户。',
    pros: ['计算速度快', '实现简单'],
    cons: ['不保证全局最优', '可能陷入局部最优'],
  },
  savings: {
    title: '🔗 节约算法',
    idea: '计算路线合并带来的节约距离，并优先合并节约最大的路线。',
    pros: ['更适合车辆路径优化问题', '通常可以获得更优路线'],
    cons: ['仍属于启发式方法'],
  },
  gurobi: {
    title: '🧮 精确优化',
    idea: '通过数学模型和优化求解器寻找满足约束的最优方案。',
    pros: ['可以获得最优解'],
    cons: ['计算时间较长'],
  },
}

interface AlgorithmModalProps {
  algorithm: string
  onClose: () => void
}

// AlgorithmModal:算法说明弹窗(纯展示)
// 根据 algorithm name 显示对应的算法说明文案;
// 未知算法显示兜底提示;点击遮罩或关闭按钮关闭
function AlgorithmModal({ algorithm, onClose }: AlgorithmModalProps) {
  const info = ALGORITHM_INFO[algorithm]

  return (
    <div className="algo-modal-overlay" onClick={onClose}>
      <div
        className="algo-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {info ? (
          <>
            <h3 className="algo-modal-title">{info.title}</h3>

            <div className="algo-modal-section">
              <p className="algo-modal-section-label">基本思想</p>
              <p className="algo-modal-section-text">{info.idea}</p>
            </div>

            <div className="algo-modal-section">
              <p className="algo-modal-section-label">优点</p>
              <ul className="algo-modal-list algo-modal-list--pros">
                {info.pros.map((pro) => (
                  <li key={pro}>✓ {pro}</li>
                ))}
              </ul>
            </div>

            <div className="algo-modal-section">
              <p className="algo-modal-section-label">不足</p>
              <ul className="algo-modal-list algo-modal-list--cons">
                {info.cons.map((con) => (
                  <li key={con}>✗ {con}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="algo-modal-section">
            <p className="algo-modal-section-text">
              暂无「{algorithm}」算法的说明信息。
            </p>
          </div>
        )}

        <button className="btn-primary algo-modal-close" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  )
}

export default AlgorithmModal
