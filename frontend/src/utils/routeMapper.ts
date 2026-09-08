import type { Campus } from '../types'

// 路线映射工具
// 后端 /solve 返回的 route 是 customer.id 数组(0 是 depot)
// Leaflet 需要经纬度坐标序列,因此需要建立 id→坐标 映射

// 地图坐标点
export interface LatLng {
  lat: number
  lng: number
}

// id 到坐标的映射项(含 name/demand 供 popup 使用)
export interface MapPoint {
  id: number
  lat: number
  lng: number
  name: string
  demand?: number
}

// 车辆配色板:按 vehicle_id 索引取色,超出范围循环复用
export const VEHICLE_COLORS: string[] = [
  '#1976d2', // 蓝
  '#d32f2f', // 红
  '#388e3c', // 绿
  '#f57c00', // 橙
  '#7b1fa2', // 紫
  '#0097a7', // 青
  '#5d4037', // 棕
  '#455a64', // 蓝灰
]

// 根据 vehicle_id 获取颜色
export function getVehicleColor(vehicleId: number): string {
  const index = vehicleId % VEHICLE_COLORS.length
  return VEHICLE_COLORS[index]
}

// 根据 /campus 数据构建 id → MapPoint 映射表
// depot(通常 id=0)和所有 customer 都加入表
export function buildIdMap(campus: Campus): Map<number, MapPoint> {
  const idMap = new Map<number, MapPoint>()

  // depot 进表
  idMap.set(campus.depot.id, {
    id: campus.depot.id,
    lat: campus.depot.latitude,
    lng: campus.depot.longitude,
    name: campus.depot.name,
  })

  // customers 进表
  campus.customers.forEach((customer) => {
    idMap.set(customer.id, {
      id: customer.id,
      lat: customer.latitude,
      lng: customer.longitude,
      name: customer.name,
      demand: customer.demand,
    })
  })

  return idMap
}

// 把后端返回的 route(id 数组)转为经纬度坐标序列
// 例如 [0, 2, 4, 0] → [{lat,lng}, {lat,lng}, {lat,lng}, {lat,lng}]
// 若 id 在表中缺失,该点会被跳过(理论上不会发生,但做容错)
export function routeToLatLngs(
  route: number[],
  idMap: Map<number, MapPoint>
): LatLng[] {
  const latLngs: LatLng[] = []
  for (const id of route) {
    const point = idMap.get(id)
    if (point) {
      latLngs.push({ lat: point.lat, lng: point.lng })
    }
  }
  return latLngs
}

// 计算单条路线的总载重(用于统计每车载了多少需求)
export function calculateRouteLoad(
  route: number[],
  idMap: Map<number, MapPoint>
): number {
  // depot(无 demand)跳过,只累加 customer
  let load = 0
  for (const id of route) {
    const point = idMap.get(id)
    if (point && point.demand !== undefined) {
      load += point.demand
    }
  }
  return load
}
