import client from './client'
import type { SolveRequest, SolveResponse, ComparisonResponse } from '../types'

// POST /solve
// 对应 backend/api/solve.py 的 solve_vrp
// 请求体:scene + algorithm + config(订单/车辆等仿真参数)
// 响应中 route 为场景稳定节点 id 的字符串数组(如 ["depot", "dorm_1", "depot"])
// 求解失败时后端返回 400,由 client 拦截器转为 Error
export async function solve(request: SolveRequest): Promise<SolveResponse> {
  const response = await client.post<SolveResponse>('/solve', request)
  return response.data
}

// POST /solve/compare
// 对应 backend/api/solve.py 的 compare_algorithms
// 请求体与 /solve 一致(algorithm 字段被忽略),后端用同一批订单
// 分别跑 nearest_neighbor + savings,返回各算法的车辆数/距离/耗时
export async function solveCompare(
  request: SolveRequest
): Promise<ComparisonResponse> {
  const response = await client.post<ComparisonResponse>(
    '/solve/compare',
    request
  )
  return response.data
}
