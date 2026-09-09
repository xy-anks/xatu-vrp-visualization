import type { Campus, SceneNode, RouteResponse } from '../types'

// 动画层坐标点:SVG viewBox 坐标系(像素),与 CampusImageMap 一致
// 由 norm 坐标换算:x = norm.x * map.width, y = norm.y * map.height
export interface AnimationPoint {
  x: number
  y: number
}

// 一辆车的动画路径:按 route 顺序排列的坐标点
export interface VehicleAnimationPath {
  vehicle_id: number
  points: AnimationPoint[]
}

// buildAnimationPaths:把求解结果的场景节点 id 路线转换为动画坐标路径
//
// 流程:
//   1. 建立 id -> SceneNode 索引(depot + 所有 customers)
//   2. 遍历每条 route,把字符串 id 序列映射为坐标点:
//        x = norm.x * campus.map.width
//        y = norm.y * campus.map.height
//   3. route 中出现未知 id 时跳过该点(不报错)
//   4. 一条路线最终有效点少于 2 个时,不生成该车辆路径
//
// 该函数为纯数据转换,不做渲染、不请求数据,供后续 Emoji 小车动画消费。
export function buildAnimationPaths(
  campus: Campus,
  routes: RouteResponse[]
): VehicleAnimationPath[] {
  // 1. 节点索引:depot + customers
  const nodeById = new Map<string, SceneNode>()
  nodeById.set(campus.depot.id, campus.depot)
  campus.customers.forEach((node) => nodeById.set(node.id, node))

  const W = campus.map.width
  const H = campus.map.height

  const paths: VehicleAnimationPath[] = []

  for (const routeResp of routes) {
    const points: AnimationPoint[] = []

    // 2 & 3. id -> 坐标,未知 id 跳过
    for (const nodeId of routeResp.route) {
      const node = nodeById.get(nodeId)
      if (!node) continue

      points.push({
        x: node.norm.x * W,
        y: node.norm.y * H,
      })
    }

    // 4. 少于两个点无法构成路径,跳过该车辆
    if (points.length < 2) continue

    paths.push({
      vehicle_id: routeResp.vehicle_id,
      points,
    })
  }

  return paths
}

// ---- 临时自测(不自动执行;由开发时手动调用验证)----
// 输入:depot -> dorm_1 -> dorm_3 -> depot,期望 points 数量为 4
export function __animationSelfTest(): void {
  const campus = {
    scene: 'xatu-campus',
    coordinate_system: 'norm',
    map: { image: 'xatu-campus-map.png', width: 1000, height: 800 },
    depot: {
      id: 'depot',
      name: '快递驿站',
      type: 'depot',
      norm: { x: 0.5, y: 0.5 },
    },
    customers: [
      { id: 'dorm_1', name: '1公寓', type: 'dorm', norm: { x: 0.1, y: 0.2 } },
      { id: 'dorm_3', name: '3公寓', type: 'dorm', norm: { x: 0.8, y: 0.3 } },
    ],
  } as Campus

  const routes: RouteResponse[] = [
    {
      vehicle_id: 0,
      route: ['depot', 'dorm_1', 'dorm_3', 'depot'],
    },
  ]

  const paths = buildAnimationPaths(campus, routes)

  if (paths.length !== 1) {
    throw new Error(`self-test: expected 1 path, got ${paths.length}`)
  }
  if (paths[0].points.length !== 4) {
    throw new Error(
      `self-test: expected 4 points, got ${paths[0].points.length}`
    )
  }

  // 未知 id 应被跳过:dorm_1 -> <unknown> -> dorm_3 => 2 个有效点
  const withUnknown = buildAnimationPaths(campus, [
    { vehicle_id: 1, route: ['dorm_1', 'not-exist', 'dorm_3'] },
    // 单条路线只有一个有效点 => 不生成路径
    { vehicle_id: 2, route: ['dorm_1', 'not-exist'] },
  ])

  if (withUnknown.length !== 1 || withUnknown[0].points.length !== 2) {
    throw new Error(
      `self-test: unknown-id handling failed, got ${JSON.stringify(withUnknown)}`
    )
  }

  // eslint-disable-next-line no-console
  console.log('animation self-test PASSED:', JSON.stringify(paths))
}
