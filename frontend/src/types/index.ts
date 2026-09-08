// TypeScript 类型定义
// 严格对应后端 FastAPI 返回结构,不自行设计字段

// GET /campus → depot
// 对应 backend/api/campus.py 中 depot 字段
export interface Depot {
  id: number
  name: string
  latitude: number
  longitude: number
}

// GET /campus → customers[]
// 对应 backend/api/campus.py 中 customer 字段
export interface Customer {
  id: number
  name: string
  latitude: number
  longitude: number
  demand: number
}

// GET /campus → vehicles[]
// 对应 backend/api/campus.py 中 vehicle 字段
export interface Vehicle {
  id: number
  capacity: number
}

// GET /campus 完整响应
export interface Campus {
  depot: Depot
  customers: Customer[]
  vehicles: Vehicle[]
}

// GET /algorithms → algorithms[]
// 对应 backend/api/algorithm.py 中 SOLVERS 字典输出
export interface Algorithm {
  name: string
  description: string
}

// GET /algorithms 完整响应
export interface AlgorithmsResponse {
  algorithms: Algorithm[]
}

// POST /solve → routes[]
// 对应 backend/schemas/solve.py 中 RouteResponse
export interface RouteResponse {
  vehicle_id: number
  route: number[]
}

// POST /solve 完整响应
// 对应 backend/schemas/solve.py 中 SolveResponse
export interface SolveResponse {
  algorithm: string
  routes: RouteResponse[]
  total_distance: number
}

// POST /solve 请求体
// 对应 backend/schemas/solve.py 中 SolveRequest
export interface SolveRequest {
  algorithm: string
}
