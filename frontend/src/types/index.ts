// TypeScript 类型定义
// 严格对应后端 FastAPI 返回结构,不自行设计字段
// 对应后端多场景架构:Scene Layer(静态世界) / Simulation Layer(仿真参数)

// ========== Scene Layer:GET /campus ==========

// 归一化图片坐标(校园场景),原点左上角,x 向右 y 向下,取值 [0, 1]
// 对应 backend/models/scene.py MapNode 的 x/y(norm 坐标系)
export interface NormCoord {
  x: number
  y: number
}

// 场景静态节点(depot 或 customer)
// 对应 backend/api/campus.py 中 depot / customers 元素
// id 为场景稳定字符串 id(如 "depot" / "dorm_1"),不是距离矩阵下标
// 当前仅支持 norm 归一化图片坐标;未来新增坐标系时在此扩展即可,
// 坐标字段保持按坐标系分组(如 geo 场景可加 latitude/longitude)
export interface SceneNode {
  id: string
  name: string
  type: string
  norm: NormCoord
}

// 地图图片元信息
// 对应 backend/api/campus.py 中 map 字段
export interface MapMeta {
  image: string
  width: number
  height: number
}

// GET /campus 完整响应
// 对应 backend/api/campus.py 的 get_campus
// 仅描述静态世界:不含订单(demand)、车辆(vehicles)等仿真动态数据
export interface Campus {
  scene: string
  coordinate_system: string
  map: MapMeta
  depot: SceneNode
  customers: SceneNode[]
}

// ========== GET /algorithms ==========
// 对应 backend/api/algorithm.py 中 SOLVERS 字典输出
export interface Algorithm {
  name: string
  description: string
}

// GET /algorithms 完整响应
export interface AlgorithmsResponse {
  algorithms: Algorithm[]
}

// ========== Simulation Layer + POST /solve ==========

// 一次仿真的动态参数(Simulation Layer)
// 对应 backend/schemas/solve.py SimulationConfig
// 这些参数不属于场景,每次请求动态传入
// mode:
//   "random" —— 后端按 order_count 随机生成订单
//   "custom" —— 前端把生成好的订单通过 orders 原样提交,后端不再随机
export interface OrderInput {
  customer_id: string
  demand: number
}

export interface SimulationConfig {
  mode: 'random' | 'custom'
  order_count?: number | null
  vehicle_count: number
  capacity: number
  seed?: number | null
  orders?: OrderInput[]
}

// POST /solve 请求体
// 对应 backend/schemas/solve.py SolveRequest
export interface SolveRequest {
  scene: string
  algorithm: string
  config: SimulationConfig
}

// POST /solve → routes[]
// route 为场景稳定节点 id 的字符串数组,如 ["depot", "dorm_1", "depot"]
// 对应 backend/schemas/solve.py RouteResponse
export interface RouteResponse {
  vehicle_id: number
  route: string[]
}

// POST /solve 完整响应
// 对应 backend/schemas/solve.py SolveResponse
export interface SolveResponse {
  scene: string
  algorithm: string
  routes: RouteResponse[]
  total_distance: number
}

// 订单(Order Layer,前端展示态)
// 一次仿真中动态生成的配送订单:指向场景中的某个客户节点
// 后续阶段会随 /solve 请求(custom 模式)提交给后端
export interface Order {
  customer_id: string
  customer_name: string
  demand: number
}

// ========== 前端场景类型(不影响后端)==========
// 当前仅西安工大校园一个仿真场景;Scene 保留为字符串字面量联合,
// 未来新增场景时在此追加即可(Home/SceneSwitcher 均从 SCENES 渲染)
export type Scene = 'xatu-campus'

// 场景元信息:供 Home 按钮与 SceneSwitcher 复用
export interface SceneMeta {
  id: Scene
  emoji: string
  title: string
  subtitle: string
}

export const SCENES: SceneMeta[] = [
  {
    id: 'xatu-campus',
    emoji: '🏫',
    title: '西安工大校园配送模拟',
    subtitle: 'XATU Campus VRP Simulator',
  },
]
