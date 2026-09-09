import type { VehiclePosition } from '../hooks/useVehicleAnimation'

// 车辆配色板:按 vehicle_id 取色,超出循环复用(与路线 polyline 同源)
// 抽出为共享出口,保证「车辆颜色」与「该车辆路线颜色」始终一致
const VEHICLE_COLORS: string[] = [
  '#1976d2', // 蓝
  '#d32f2f', // 红
  '#388e3c', // 绿
  '#f57c00', // 橙
  '#7b1fa2', // 紫
  '#0097a7', // 青
  '#5d4037', // 棕
  '#455a64', // 蓝灰
]

export function getVehicleColor(vehicleId: number): string {
  return VEHICLE_COLORS[vehicleId % VEHICLE_COLORS.length]
}

interface VehicleLayerProps {
  positions: VehiclePosition[]
}

// VehicleLayer:配送车辆图层(SVG 片段,由 CampusImageMap 嵌入同一个 <svg>)
// 坐标系与底图/路线完全一致(viewBox = map.width × map.height)。
//
// 车辆位置由 useVehicleAnimation 按时间插值得到(positions):
//   - Solve 后车辆从 depot(points[0])出发,沿各自路线移动,
//     经过客户点,最后回到 depot;多辆车各自独立移动。
//   - 本组件只负责把当前位置渲染出来,不计算动画。
//
// 渲染:每辆车一个彩色圆底(颜色按 vehicle_id 稳定区分,与其路线同色)
// + 🚚 emoji 居中;圆底中心对齐位置坐标(textAnchor/dominantBaseline
// 居中,避免左上角对齐造成的系统性偏移)。无 positions 时不渲染。
function VehicleLayer({ positions }: VehicleLayerProps) {
  return (
    <g>
      {positions.map((pos) => {
        const color = getVehicleColor(pos.vehicle_id)

        return (
          <g key={pos.vehicle_id}>
            {/* 彩色圆底:车辆身份色,与该车辆路线同色 */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={26}
              fill={color}
              stroke="#fff"
              strokeWidth={3}
              opacity={0.92}
            />
            {/* 🚚 emoji,中心对齐车辆当前位置 */}
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={34}
            >
              🚚
            </text>
          </g>
        )
      })}
    </g>
  )
}

export default VehicleLayer
