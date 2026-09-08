import client from './client'
import type { Campus } from '../types'

// GET /campus
// 对应 backend/api/campus.py 的 get_campus
// 返回 depot / customers / vehicles,用于地图渲染
export async function getCampus(): Promise<Campus> {
  const response = await client.get<Campus>('/campus')
  return response.data
}
