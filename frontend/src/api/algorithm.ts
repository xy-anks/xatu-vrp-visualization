import client from './client'
import type { Algorithm, AlgorithmsResponse } from '../types'

// GET /algorithms
// 对应 backend/api/algorithm.py 的 get_algorithms
// 返回算法列表,用于下拉框填充
export async function getAlgorithms(): Promise<Algorithm[]> {
  const response = await client.get<AlgorithmsResponse>('/algorithms')
  return response.data.algorithms
}
