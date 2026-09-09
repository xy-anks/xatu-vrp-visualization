import { useEffect, useMemo, useState } from 'react'
import type { Campus, Order } from '../types'
import type { VehicleAnimationPath } from '../utils/animation'
import type { VehiclePosition } from './useVehicleAnimation'

// 到达判定阈值(SVG viewBox 单位):车辆与订单节点距离 < 该值即视为到达
export const ARRIVAL_DISTANCE = 30

// ---------- 纯函数(便于无 React 环境直接测试) ----------

// 欧氏距离
export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.hypot(x2 - x1, y2 - y1)
}

// 到达判断:严格小于阈值
export function isArrived(
  d: number,
  threshold: number = ARRIVAL_DISTANCE
): boolean {
  return d < threshold
}

// 配送目标节点:订单对应的 customer 节点在 SVG 坐标系中的位置。
// 坐标换算与底图/路线/车辆完全一致:x = norm.x * map.width, y = norm.y * map.height
export interface DeliveryTarget {
  customer_id: string
  x: number
  y: number
}

export function buildDeliveryTargets(
  campus: Campus,
  orders: Order[]
): DeliveryTarget[] {
  const W = campus.map.width
  const H = campus.map.height

  // customer_id -> 场景节点
  const nodeById = new Map<string, (typeof campus.customers)[number]>()
  for (const c of campus.customers) nodeById.set(c.id, c)

  // 同一 customer 可能有多笔订单,去重(配送状态按客户节点判定)
  const seen = new Set<string>()
  const targets: DeliveryTarget[] = []

  for (const order of orders) {
    if (seen.has(order.customer_id)) continue
    const node = nodeById.get(order.customer_id)
    if (!node) continue
    seen.add(order.customer_id)
    targets.push({
      customer_id: order.customer_id,
      x: node.norm.x * W,
      y: node.norm.y * H,
    })
  }

  return targets
}

// 当前帧处于「车辆正在附近(active)」的客户 id 列表
export function computeActiveCustomerIds(
  targets: DeliveryTarget[],
  positions: VehiclePosition[]
): string[] {
  const active: string[] = []
  for (const t of targets) {
    const near = positions.some((p) =>
      isArrived(distance(p.x, p.y, t.x, t.y))
    )
    if (near) active.push(t.customer_id)
  }
  return active
}

// ---------- Hook ----------

export interface DeliveryStatus {
  // 已到达过(送达)的客户 id:只增不减,直到新一轮 Solve 重置
  deliveredCustomerIds: string[]
  // 当前帧车辆正在附近(< 阈值)的客户 id
  activeCustomerIds: string[]
}

// useDeliveryStatus:根据车辆动画实时位置判断订单配送状态
//
// 状态机(pending -> active -> delivered):
//   pending   默认,车辆尚未接近
//   active    本帧有车辆与该订单节点 SVG 距离 < 30
//   delivered 曾经到达过(累计,跨帧保持)
//
// 新一轮求解(paths 引用变化)时 delivered 自动清空。
export function useDeliveryStatus(
  paths: VehicleAnimationPath[],
  positions: VehiclePosition[],
  orders: Order[],
  campus: Campus
): DeliveryStatus {
  // 订单配送目标(SVG 坐标),订单/场景变化时重算
  const targets = useMemo(
    () => buildDeliveryTargets(campus, orders),
    [campus, orders]
  )

  // 本帧 active:车辆正在附近的客户
  const activeCustomerIds = useMemo(
    () => computeActiveCustomerIds(targets, positions),
    [targets, positions]
  )

  // delivered:累计到达过的客户;用 state 保证跨帧保持且触发渲染
  const [deliveredCustomerIds, setDeliveredCustomerIds] = useState<string[]>([])

  // 新一轮 Solve(paths 变化)时重置送达记录
  useEffect(() => {
    setDeliveredCustomerIds([])
  }, [paths])

  // 本帧 active 的客户并入 delivered(只增不减)
  useEffect(() => {
    if (activeCustomerIds.length === 0) return
    setDeliveredCustomerIds((prev) => {
      const set = new Set(prev)
      let changed = false
      for (const id of activeCustomerIds) {
        if (!set.has(id)) {
          set.add(id)
          changed = true
        }
      }
      return changed ? Array.from(set) : prev
    })
  }, [activeCustomerIds])

  return { deliveredCustomerIds, activeCustomerIds }
}

// ---------- 纯函数自测(esbuild 转译后 node 执行) ----------

export function __deliverySelfTest(): boolean {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error('delivery self-test FAIL: ' + msg)
  }

  // distance 计算
  assert(distance(0, 0, 3, 4) === 5, 'distance 3-4-5')
  assert(distance(0, 0, 0, 0) === 0, 'distance zero')
  assert(distance(100, 100, 100, 130) === 30, 'distance vertical 30')
  assert(Math.abs(distance(10, 20, 13, 24) - 5) < 1e-9, 'distance 3-4-5 offset')

  // 到达判断(严格小于 30)
  assert(isArrived(0) === true, 'arrived d=0')
  assert(isArrived(29.999) === true, 'arrived d<30')
  assert(isArrived(30) === false, 'arrived d=30 边界(不含)')
  assert(isArrived(30.001) === false, 'arrived d>30')
  assert(isArrived(10, 5) === false, '自定义阈值 d=10 threshold=5')
  assert(isArrived(4, 5) === true, '自定义阈值 d=4 threshold=5')

  // active 计算:目标 (100,100),车辆距离 20 → active;距离 40 → 不 active
  const targets: DeliveryTarget[] = [
    { customer_id: 'a', x: 100, y: 100 },
    { customer_id: 'b', x: 300, y: 300 },
  ]
  const near = computeActiveCustomerIds(targets, [
    { vehicle_id: 0, x: 120, y: 100 }, // 距 a = 20 < 30
  ])
  assert(
    near.length === 1 && near[0] === 'a',
    'active: 仅距离<30 的客户命中'
  )
  const far = computeActiveCustomerIds(targets, [
    { vehicle_id: 0, x: 140, y: 100 }, // 距 a = 40
  ])
  assert(far.length === 0, 'active: 距离>=30 不命中')
  const none = computeActiveCustomerIds(targets, [])
  assert(none.length === 0, 'active: 无车辆时为空')

  return true
}
