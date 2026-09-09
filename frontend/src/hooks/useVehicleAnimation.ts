import { useEffect, useRef, useState } from 'react'
import type { VehicleAnimationPath, AnimationPoint } from '../utils/animation'

// 每两个相邻路径点之间的移动时长(毫秒)
const SEGMENT_MS = 1000

export interface VehiclePosition {
  vehicle_id: number
  x: number
  y: number
}

// 纯函数:按经过时间 elapsedMs 计算单条路径上的当前坐标。
//
// 每段(points[i] -> points[i+1])耗时 SEGMENT_MS,线性插值:
//   seg     = floor(elapsed / SEGMENT_MS)
//   ratio   = (elapsed - seg*SEGMENT_MS) / SEGMENT_MS   ∈ [0,1)
//   pos     = points[seg] + (points[seg+1] - points[seg]) * ratio
// 到达终点后(elapsed >= (n-1)*SEGMENT_MS)停在最后一个点。
// 抽成纯函数便于无 DOM/无 React 环境下直接测试插值正确性。
export function interpolatePathAt(
  points: AnimationPoint[],
  elapsedMs: number
): AnimationPoint | null {
  if (!points || points.length === 0) return null
  if (points.length === 1) return { ...points[0] }

  // 单段总时长 = (点数 - 1) * SEGMENT_MS
  const totalMs = (points.length - 1) * SEGMENT_MS
  const elapsed = Math.max(0, Math.min(elapsedMs, totalMs))

  const seg = Math.min(
    points.length - 2,
    Math.floor(elapsed / SEGMENT_MS)
  )
  const ratio = (elapsed - seg * SEGMENT_MS) / SEGMENT_MS

  const p1 = points[seg]
  const p2 = points[seg + 1]

  return {
    x: p1.x + (p2.x - p1.x) * ratio,
    y: p1.y + (p2.y - p1.y) * ratio,
  }
}

// 取一组路径在 elapsedMs 时的全部车辆位置
function computePositions(
  paths: VehicleAnimationPath[],
  elapsedMs: number
): VehiclePosition[] {
  const positions: VehiclePosition[] = []

  for (const path of paths) {
    const point = interpolatePathAt(path.points, elapsedMs)
    if (!point) continue
    positions.push({ vehicle_id: path.vehicle_id, x: point.x, y: point.y })
  }

  return positions
}

// 初始(动画开始前)位置:每辆车在其路线起点 points[0]
function initialPositions(paths: VehicleAnimationPath[]): VehiclePosition[] {
  return computePositions(paths, 0)
}

interface VehicleAnimationApi {
  positions: VehiclePosition[]
  startAnimation: () => void
  stopAnimation: () => void
}

// useVehicleAnimation:配送车辆动画控制器
//
// - 输入 VehicleAnimationPath[],用 requestAnimationFrame 驱动;
// - paths 变化时自动重置到起点并重新开始动画;
// - 组件卸载时 cancelAnimationFrame;
// - 动画开始前车辆位于 points[0];到达终点后停在最后一个点。
export function useVehicleAnimation(
  paths: VehicleAnimationPath[]
): VehicleAnimationApi {
  const [positions, setPositions] = useState<VehiclePosition[]>(() =>
    initialPositions(paths)
  )

  // 用 ref 持有最新 paths,保证 rAF 回调不读到陈旧闭包
  const pathsRef = useRef(paths)
  pathsRef.current = paths

  const rafIdRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)

  function cancelFrame() {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }

  // 单帧步进:按「起始时间到现在」的 elapsed 在各路径上插值。
  // 全部车辆都到终点则停止调度。只通过 refs 与稳定的 setPositions 访问数据。
  function step(now: number) {
    const elapsed = now - startRef.current
    setPositions(computePositions(pathsRef.current, elapsed))

    const totalMs = (p: VehicleAnimationPath) =>
      Math.max(0, (p.points.length - 1) * SEGMENT_MS)
    const stillMoving = pathsRef.current.some((p) => elapsed < totalMs(p))

    if (stillMoving) {
      rafIdRef.current = requestAnimationFrame(step)
    } else {
      rafIdRef.current = null
    }
  }

  function startAnimation() {
    cancelFrame()
    startRef.current = performance.now()
    setPositions(initialPositions(pathsRef.current))
    rafIdRef.current = requestAnimationFrame(step)
  }

  function stopAnimation() {
    cancelFrame()
  }

  // paths 变化:回到起点并自动重新开始;卸载时取消动画帧。
  // 循环放在 effect 内,起始时间戳/帧句柄为 effect 局部量,
  // 避免外部闭包链在多次重渲染后失效或被反复重置。
  useEffect(() => {
    setPositions(initialPositions(paths))
    startRef.current = performance.now()
    cancelFrame()
    rafIdRef.current = requestAnimationFrame(step)

    return () => {
      cancelFrame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths])

  return { positions, startAnimation, stopAnimation }
}
