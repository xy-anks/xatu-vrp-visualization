import type { ChangeEvent } from 'react'

interface SimulationConfigValues {
  orderCount: number
  vehicleCount: number
  capacity: number
}

interface SimulationConfigPanelProps {
  value: SimulationConfigValues
  onChange: (next: SimulationConfigValues) => void
  disabled?: boolean
}

// SimulationConfigPanel:仿真参数面板(纯 UI)
// 展示并修改:订单数量 / 车辆数量 / 车辆容量
// 职责边界:不请求 API、不触发求解,仅通过 onChange 回传最新参数
function SimulationConfigPanel({
  value,
  onChange,
  disabled,
}: SimulationConfigPanelProps) {
  // 数字输入统一处理:空/非法值回退为 1,最小为 1
  const handleNumber =
    (key: keyof SimulationConfigValues) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10)
      const next = Number.isFinite(parsed) ? Math.max(1, parsed) : 1
      onChange({ ...value, [key]: next })
    }

  const fields: Array<{
    key: keyof SimulationConfigValues
    label: string
    min: number
  }> = [
    { key: 'orderCount', label: '订单数量', min: 1 },
    { key: 'vehicleCount', label: '车辆数量', min: 1 },
    { key: 'capacity', label: '车辆容量', min: 1 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {fields.map((field) => (
        <div key={field.key}>
          <label
            htmlFor={`config-${field.key}`}
            style={{
              display: 'block',
              fontSize: 13,
              color: '#666',
              marginBottom: 4,
            }}
          >
            {field.label}
          </label>
          <input
            id={`config-${field.key}`}
            type="number"
            min={field.min}
            value={value[field.key]}
            onChange={handleNumber(field.key)}
            disabled={disabled}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      ))}
    </div>
  )
}

export default SimulationConfigPanel
