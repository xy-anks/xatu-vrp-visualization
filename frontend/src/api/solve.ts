import client from './client'
import type { SolveRequest, SolveResponse } from '../types'

// POST /solve
// 对应 backend/api/solve.py 的 solve_vrp
// 入参 algorithm 对应 SolveRequest.algorithm
// 求解失败时后端返回 400,由 client 拦截器转为 Error
export async function solve(algorithm: string): Promise<SolveResponse> {
  const request: SolveRequest = { algorithm }
  const response = await client.post<SolveResponse>('/solve', request)
  return response.data
}
