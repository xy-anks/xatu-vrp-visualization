import { useMemo } from 'react'
import type { Campus, SceneNode, SolveResponse } from '../types'
import { getVehicleColor } from './VehicleLayer'

interface RouteSummaryProps {
  campus: Campus
  solveResult: SolveResponse | null
}

// 真实世界地图的路线信息面板(纯展示,无动画)
// 展示内容:
//   - 总车辆数
//   - 每辆车经过的节点序列(按 solveResult.routes 中字符串 id 顺序翻译为节点名)
//   - 每辆车路线长度:geo 场景节点带经纬度,前端用 haversine 累加估算;
//     节点缺经纬度时显示 "—"(为后端未来下发每车距离预留)
// 职责边界:不请求 API、不修改求解结果,数据全部由 props 下传

// 地球平均半径(米),haversine 公式用
const EARTH_RADIUS_M = 6371000

// 两经纬度点间大圆距离(米)
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

// 单辆车的摘要行
interface RouteRow {
  vehicleId: number
  color: string
  // 节点名称序列(与 route id 顺序一致,起点终点均为 depot)
  nodeNames: string[]
  // 路线长度(km);任一节点缺经纬度时为 null(显示 "—")
  lengthKm: number | null
}

function RouteSummary({ campus, solveResult }: RouteSummaryProps) {
  // id -> 场景节点(depot + customers),route 字符串 id 翻译为节点名用
  const nodeById = useMemo(() => {
    const map = new Map<string, SceneNode>()
    map.set(campus.depot.id, campus.depot)
    campus.customers.forEach((node) => map.set(node.id, node))
    return map
  }, [campus])

  // 每辆车摘要:节点名序列 + haversine 估算路线长度
  const rows = useMemo<RouteRow[]>(() => {
    if (!solveResult) return []

    return solveResult.routes.map((routeResp) => {
      // 字符串 id -> 节点;未知 id 直接跳过(与地图 Polyline 口径一致)
      const nodes = routeResp.route
        .map((id) => nodeById.get(id))
        .filter((node): node is SceneNode => node !== undefined)

      // 路线长度:所有节点都有经纬度才可估算,否则置 null(预留展示)
      let lengthKm: number | null = 0
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node.latitude == null || node.longitude == null) {
          lengthKm = null
          break
        }
        if (i > 0) {
          const prev = nodes[i - 1]
          lengthKm += haversineMeters(
            prev.latitude!,
            prev.longitude!,
            node.latitude,
            node.longitude
          ) / 1000
        }
      }

      return {
        vehicleId: routeResp.vehicle_id,
        color: getVehicleColor(routeResp.vehicle_id),
        nodeNames: nodes.map((node) => node.name),
        lengthKm,
      }
    })
  }, [solveResult, nodeById])

  // 无求解结果时不渲染面板
  if (rows.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000, // 盖在 Leaflet 瓦片/控件之上
        maxWidth: 280,
        maxHeight: 'calc(100% - 20px)',
        overflowY: 'auto',
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        padding: '10px 12px',
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      {/* 总车辆数 */}
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        路线概览 · 共 {rows.length} 辆车
      </div>

      {rows.map((row) => (
        <div
          key={row.vehicleId}
          style={{
            borderTop: '1px solid #eeeeee',
            padding: '6px 0',
          }}
        >
          {/* 车辆身份行:色点与地图路线同色(getVehicleColor)+ 每车路线长度 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: row.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 700 }}>车辆 {row.vehicleId}</span>
            <span style={{ marginLeft: 'auto', color: '#616161' }}>
              {row.lengthKm != null
                ? `${row.lengthKm.toFixed(2)} km`
                : '长度待接入'}
            </span>
          </div>

          {/* 经过节点:按 route 顺序,depot → 客户 → … → depot */}
          <div style={{ color: '#424242', wordBreak: 'break-all' }}>
            {row.nodeNames.join(' → ')}
          </div>
        </div>
      ))}
    </div>
  )
}

export default RouteSummary
