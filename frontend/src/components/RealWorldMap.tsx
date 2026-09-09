import { useMemo } from 'react'
import * as L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Campus, Order, SceneNode, SolveResponse } from '../types'
import { getVehicleColor } from './VehicleLayer'
import RouteSummary from './RouteSummary'

interface RealWorldMapProps {
  campus: Campus
  solveResult: SolveResponse | null
  orders: Order[]
}

// 真实世界地图组件(纯展示,为 coordinate_system="geo" 的场景准备)
// 与 CampusImageMap 平行的独立渲染层:
//   CampusImageMap: norm 坐标    -> 单 SVG overlay
//   RealWorldMap:   lat/lng 坐标 -> Leaflet(瓦片底图 + Marker + Polyline)
// 职责边界:不请求 API、不生成订单、不处理求解逻辑,数据全部由 props 下传。
// 本阶段只做静态路线 + 节点展示,车辆动画后续接入。

// 无任何节点可定位时的兜底中心(默认)
const DEFAULT_CENTER: [number, number] = [34.26, 108.94]
const DEFAULT_ZOOM = 15

// 节点经纬度 -> Leaflet [lat, lng];geo 场景未提供经纬度的节点返回 null
function nodeLatLng(node: SceneNode): [number, number] | null {
  if (node.latitude == null || node.longitude == null) return null
  return [node.latitude, node.longitude]
}

// 彩色针脚图标:用 divIcon 内嵌 SVG,无图片资源、颜色参数化
// depot 蓝 / 有订单客户红 / 无订单客户灰,与校园地图节点配色一致
function createPinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'rw-pin',
    html: `<svg width="26" height="38" viewBox="0 0 26 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 25 13 25s13-15.3 13-25C26 5.8 20.2 0 13 0z"
        fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="13" cy="13" r="4.5" fill="#ffffff"/>
    </svg>`,
    iconSize: [26, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -36],
  })
}

// 节点配色(与 CampusImageMap 保持一致)
const DEPOT_COLOR = '#1976d2'
const CUSTOMER_ORDER_COLOR = '#e53935'
const CUSTOMER_IDLE_COLOR = '#9e9e9e'

function RealWorldMap({ campus, solveResult, orders }: RealWorldMapProps) {
  // id -> 场景节点(depot + customers),路线 id 翻译用
  const nodeById = useMemo(() => {
    const map = new Map<string, SceneNode>()
    map.set(campus.depot.id, campus.depot)
    campus.customers.forEach((node) => map.set(node.id, node))
    return map
  }, [campus])

  // customer_id -> 聚合需求(同一客户多单累加,与后端 problem_builder 口径一致)
  const orderMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const order of orders) {
      map.set(order.customer_id, (map.get(order.customer_id) ?? 0) + order.demand)
    }
    return map
  }, [orders])

  // 地图中心:depot -> 第一个 customer -> 默认
  const center = useMemo<[number, number]>(() => {
    return (
      nodeLatLng(campus.depot) ??
      (campus.customers.length > 0 ? nodeLatLng(campus.customers[0]) : null) ??
      DEFAULT_CENTER
    )
  }, [campus])

  // 路线折线:route 字符串 id 序列 -> [lat,lng] 序列
  // 未知 id 或无经纬度的节点跳过;有效点 < 2 不绘制
  const polylines = useMemo(() => {
    if (!solveResult) return []

    return solveResult.routes.map((routeResp) => {
      const latlngs: [number, number][] = []

      for (const nodeId of routeResp.route) {
        const node = nodeById.get(nodeId)
        if (!node) continue
        const ll = nodeLatLng(node)
        if (ll) latlngs.push(ll)
      }

      return {
        vehicleId: routeResp.vehicle_id,
        color: getVehicleColor(routeResp.vehicle_id),
        latlngs,
        valid: latlngs.length >= 2,
      }
    })
  }, [solveResult, nodeById])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* key=campus.scene:切换场景时重建地图,保证 center/zoom 重新生效 */}
      <MapContainer
        key={campus.scene}
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution="&copy; Stadia Maps &copy; OpenStreetMap contributors"
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png"
        />

        {/* Depot:蓝色 Marker */}
        {(() => {
          const ll = nodeLatLng(campus.depot)
          if (!ll) return null
          return (
            <Marker position={ll} icon={createPinIcon(DEPOT_COLOR)}>
              <Popup>
                <b>{campus.depot.name}</b>
                <br />
                配送中心
              </Popup>
            </Marker>
          )
        })()}

        {/* Customer:有订单红 / 无订单灰,Popup 显示名称与聚合需求量 */}
        {campus.customers.map((node) => {
          const ll = nodeLatLng(node)
          if (!ll) return null

          const demand = orderMap.get(node.id)
          const hasOrder = demand !== undefined

          return (
            <Marker
              key={node.id}
              position={ll}
              icon={createPinIcon(hasOrder ? CUSTOMER_ORDER_COLOR : CUSTOMER_IDLE_COLOR)}
            >
              <Popup>
                <b>{node.name}</b>
                {hasOrder && (
                  <>
                    <br />
                    需求量:{demand}
                  </>
                )}
              </Popup>
            </Marker>
          )
        })}

        {/* 配送路线:颜色按 vehicle_id 复用 getVehicleColor,与校园地图一致 */}
        {polylines.map(
          (line) =>
            line.valid && (
              <Polyline
                key={line.vehicleId}
                positions={line.latlngs}
                pathOptions={{ color: line.color, weight: 5, opacity: 0.85 }}
              />
            )
        )}
      </MapContainer>

      {/* 路线信息面板:总车辆数 / 每车节点序列 / 每车路线长度(纯展示,无动画) */}
      <RouteSummary campus={campus} solveResult={solveResult} />
    </div>
  )
}

export default RealWorldMap
