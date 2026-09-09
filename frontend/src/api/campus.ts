import client from './client'
import type { Campus } from '../types'

// GET /campus?scene=xxx
// 对应 backend/api/campus.py 的 get_campus
// 返回静态场景:map 元信息 + depot + customers(norm 坐标,字符串节点 id)
// 不包含订单 / 车辆等仿真动态数据
export async function getCampus(scene: string): Promise<Campus> {
  const response = await client.get<Campus>('/campus', {
    params: { scene },
  })
  return response.data
}
