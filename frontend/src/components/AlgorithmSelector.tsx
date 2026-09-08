import type { Algorithm } from '../types'

interface AlgorithmSelectorProps {
  algorithms: Algorithm[]
  value: string
  onChange: (name: string) => void
  disabled?: boolean
}

// AlgorithmSelector:算法下拉框
// 职责:仅做选择交互,把选中值通过 onChange 回传给父组件
function AlgorithmSelector({
  algorithms,
  value,
  onChange,
  disabled,
}: AlgorithmSelectorProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        htmlFor="algorithm-select"
        style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}
      >
        选择算法
      </label>
      <select
        id="algorithm-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || algorithms.length === 0}
      >
        {algorithms.length === 0 ? (
          <option value="">无可用算法</option>
        ) : (
          <>
            <option value="">请选择...</option>
            {algorithms.map((algo) => (
              <option key={algo.name} value={algo.name}>
                {algo.name}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  )
}

export default AlgorithmSelector
