import { useEffect, useMemo, useRef } from 'react'
import type { Campus, SceneNode, SolveResponse, Order } from '../types'
import { buildAnimationPaths } from '../utils/animation'
import { useVehicleAnimation } from '../hooks/useVehicleAnimation'
import { useDeliveryStatus } from '../hooks/useDeliveryStatus'
import type { DeliveryStatus } from '../hooks/useDeliveryStatus'
import VehicleLayer, { getVehicleColor } from './VehicleLayer'

interface CampusImageMapProps {
  campus: Campus
  solveResult: SolveResponse | null
  orders: Order[]
  // 配送状态变化时上报给父组件(用于驱动订单面板);仅在状态真正翻转时触发
  onDeliveryStatusChange?: (status: DeliveryStatus) => void
}

// CampusImageMap:校园图片底图组件(纯展示)
// - 以静态图片为底图(public/maps/<campus.map.image>,即 /maps/xxx.png)
// - 节点与路线全部画在同一个 SVG 叠加层中:
//   * SVG viewBox = map.width × map.height,preserveAspectRatio 与底图
//     object-fit:contain 同为 xMidYMid meet,因此图片留边与 SVG 内容
//     始终重合,节点坐标 norm 换算为 norm.x*width / norm.y*height
// - 路线由后端返回的字符串节点 id 序列经 id->node 映射转为 polyline
// 职责边界:不请求 API、不管理 solve 状态,数据全部由 props 下传
function CampusImageMap({
  campus,
  solveResult,
  orders,
  onDeliveryStatusChange,
}: CampusImageMapProps) {
  const W = campus.map.width
  const H = campus.map.height

  // id -> SceneNode 映射(depot + 所有 customer),campus 变化时重建
  const nodeById = useMemo(() => {
    const map = new Map<string, SceneNode>()
    map.set(campus.depot.id, campus.depot)
    campus.customers.forEach((node) => map.set(node.id, node))
    return map
  }, [campus])

  // customer_id -> demand 聚合映射(订单态),orders 变化时重建
  // 同一客户节点多单时需求累加(与后端 problem_builder 聚合口径一致)
  const orderMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const order of orders) {
      map.set(
        order.customer_id,
        (map.get(order.customer_id) ?? 0) + order.demand
      )
    }
    return map
  }, [orders])

  // 路线解析:字符串 id 序列 -> SVG 点序列(严格保持顺序,缺失 id 跳过)
  const polylines = useMemo(() => {
    if (!solveResult) return []

    return solveResult.routes.map((routeResp) => {
      const points: Array<{ x: number; y: number }> = []

      for (const nodeId of routeResp.route) {
        const node = nodeById.get(nodeId)
        if (node) {
          points.push({ x: node.norm.x * W, y: node.norm.y * H })
        }
      }

      return {
        vehicleId: routeResp.vehicle_id,
        color: getVehicleColor(routeResp.vehicle_id),
        pointsAttr: points.map((p) => `${p.x},${p.y}`).join(' '),
        valid: points.length >= 2,
      }
    })
  }, [solveResult, nodeById, W, H])

  // 车辆动画路径:把场景 id 路线转为与路线同一 SVG 坐标系的点序列
  const vehiclePaths = useMemo(() => {
    if (!solveResult) return []
    return buildAnimationPaths(campus, solveResult.routes)
  }, [campus, solveResult])

  // 车辆动画:hook 在 paths 变化(即 Solve 得到新结果)时自动从起点播放,
  // 无需手动启动;组件卸载时自动 cancelAnimationFrame
  const { positions } = useVehicleAnimation(vehiclePaths)

  // 配送状态:依据车辆实时位置判断订单 pending(等待)/active(车辆在附近)/delivered(到达过)
  const { deliveredCustomerIds, activeCustomerIds } = useDeliveryStatus(
    vehiclePaths,
    positions,
    orders,
    campus
  )

  const deliveredSet = useMemo(
    () => new Set(deliveredCustomerIds),
    [deliveredCustomerIds]
  )
  const activeSet = useMemo(
    () => new Set(activeCustomerIds),
    [activeCustomerIds]
  )

  // 把状态上报父组件以驱动订单面板。用集合内容签名做闸:
  // 仅在状态真正翻转(到达/离开)时才触发父组件更新,避免每帧 setState
  const statusSignature =
    deliveredCustomerIds.join(',') + '|' + activeCustomerIds.join(',')
  const lastStatusSigRef = useRef<string>('')
  useEffect(() => {
    if (statusSignature !== lastStatusSigRef.current) {
      lastStatusSigRef.current = statusSignature
      onDeliveryStatusChange?.({ deliveredCustomerIds, activeCustomerIds })
    }
  }, [
    statusSignature,
    deliveredCustomerIds,
    activeCustomerIds,
    onDeliveryStatusChange,
  ])

  // 节点在 SVG 坐标系(viewBox 像素)中的位置
  const nodePos = (node: SceneNode) => ({
    cx: node.norm.x * W,
    cy: node.norm.y * H,
  })

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* 底图:/maps/<campus.map.image>,contain 居中留边 */}
      <img
        src={`/maps/${campus.map.image}`}
        alt={campus.scene}
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          userSelect: 'none',
        }}
      />

      {/* 叠加层:viewBox 与底图同宽高比,preserveAspectRatio=meet
          与 object-fit:contain 的留边规则一致,保证路线/节点贴合图片 */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {/* 配送路线 */}
        {polylines.map(
          (line) =>
            line.valid && (
              <polyline
                key={line.vehicleId}
                points={line.pointsAttr}
                fill="none"
                stroke={line.color}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            )
        )}

        {/* 配送车辆图层:由动画 hook 驱动,车辆沿各自路线移动 */}
        <VehicleLayer positions={positions} />

        {/* Customer 节点:
            - 无订单:橙色小圆点
            - 有订单,按配送状态(优先级 delivered > active > pending):
                pending   红色圆点 + 上方 demand 数字
                active    黄色圆点 + 上方 demand 数字(车辆正在附近配送中)
                delivered 绿色圆点 + 上方 ✓(已送达)
            宿舍名称统一放在节点下方,避免与上方数字重叠 */}
        {campus.customers.map((node) => {
          const { cx, cy } = nodePos(node)
          const demand = orderMap.get(node.id)
          const hasOrder = demand !== undefined

          // 配送状态(仅对有订单节点有意义)
          const delivered = hasOrder && deliveredSet.has(node.id)
          const active = hasOrder && activeSet.has(node.id)

          // 节点颜色:无订单橙;有订单 delivered 绿 > active 黄 > pending 红
          const fill = !hasOrder
            ? '#ff7043'
            : delivered
              ? '#43a047'
              : active
                ? '#fbc02d'
                : '#e53935'

          // 节点上方标签:delivered 显示 ✓,其余显示 demand 数字
          const labelText = delivered ? '✓' : String(demand)
          const labelStroke = delivered ? '#1b5e20' : '#b71c1c'

          const statusText = delivered
            ? '已送达'
            : active
              ? '配送中'
              : '等待配送'

          return (
            <g key={node.id}>
              <circle
                cx={cx}
                cy={cy}
                r={hasOrder ? 15 : 11}
                fill={fill}
                stroke="#fff"
                strokeWidth={3}
              >
                <title>
                  {hasOrder
                    ? `${node.name} 需求:${demand} [${statusText}]`
                    : node.name}
                </title>
              </circle>

              {/* 订单标签:节点上方(delivered 为 ✓,否则为 demand 数字) */}
              {hasOrder && (
                <text
                  x={cx}
                  y={cy - 22}
                  textAnchor="middle"
                  fontSize={delivered ? 24 : 22}
                  fontWeight={800}
                  fill="#fff"
                  stroke={labelStroke}
                  strokeWidth={5}
                  paintOrder="stroke"
                >
                  {labelText}
                </text>
              )}

              {/* 宿舍名称:节点下方 */}
              <text
                x={cx}
                y={cy + 30}
                textAnchor="middle"
                fontSize={20}
                fill="#fff"
                stroke="rgba(0,0,0,0.6)"
                strokeWidth={4}
                paintOrder="stroke"
              >
                {node.name}
              </text>
            </g>
          )
        })}

        {/* Depot 节点(蓝色方块) */}
        {(() => {
          const { cx, cy } = nodePos(campus.depot)
          return (
            <g>
              <rect
                x={cx - 12}
                y={cy - 12}
                width={24}
                height={24}
                rx={5}
                fill="#1976d2"
                stroke="#fff"
                strokeWidth={3}
              >
                <title>{campus.depot.name}</title>
              </rect>
              <text
                x={cx}
                y={cy - 20}
                textAnchor="middle"
                fontSize={22}
                fontWeight={700}
                fill="#fff"
                stroke="rgba(25,118,210,0.9)"
                strokeWidth={5}
                paintOrder="stroke"
              >
                {campus.depot.name}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

export default CampusImageMap
