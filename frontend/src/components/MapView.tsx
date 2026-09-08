import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import type { Campus, SolveResponse } from '../types'
import {
  buildIdMap,
  routeToLatLngs,
  getVehicleColor,
} from '../utils/routeMapper'

// Leaflet 默认图标在打包工具下会路径错乱,需手动修正
import 'leaflet/dist/leaflet.css'

// 修正默认 marker 图标(避免 Vite 环境下图标不显示)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface MapViewProps {
  campus: Campus
  solveResult: SolveResponse | null
}

// MapView:Leaflet 地图容器
// 职责:渲染 depot / customer / routes,不做业务逻辑
// 数据从 App 顶层下传,内部仅做 id→坐标 的转换
function MapView({ campus, solveResult }: MapViewProps) {
  // 基于 campus 建立 id→坐标映射表(每次 campus 变化时重建)
  const idMap = buildIdMap(campus)

  // 地图中心:depot 坐标
  const center: [number, number] = [
    campus.depot.latitude,
    campus.depot.longitude,
  ]

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
    >
      {/* OSM 标准底图 */}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
      />

      {/* Depot marker(蓝色) */}
      <Marker position={center}>
        <Popup>
          <strong>Depot</strong>
          <br />
          {campus.depot.name}
        </Popup>
      </Marker>

      {/* Customer markers + demand popup */}
      {campus.customers.map((customer) => (
        <Marker
          key={customer.id}
          position={[customer.latitude, customer.longitude]}
        >
          <Popup>
            <strong>{customer.name}</strong>
            <br />
            需求量: {customer.demand}
          </Popup>
        </Marker>
      ))}

      {/* 路线绘制:按 vehicle_id 分色 */}
      {solveResult &&
        solveResult.routes.map((routeResp) => {
          const latLngs = routeToLatLngs(routeResp.route, idMap)
          const color = getVehicleColor(routeResp.vehicle_id)

          // 至少要有两点才能画线
          if (latLngs.length < 2) return null

          return (
            <Polyline
              key={routeResp.vehicle_id}
              positions={latLngs.map((p) => [p.lat, p.lng]) as [number, number][]}
              pathOptions={{
                color,
                weight: 4,
                opacity: 0.8,
              }}
            />
          )
        })}
    </MapContainer>
  )
}

export default MapView
