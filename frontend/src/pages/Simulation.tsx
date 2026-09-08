import { useEffect, useState } from 'react'
import { getCampus } from '../api/campus'
import { getAlgorithms } from '../api/algorithm'
import { solve as solveApi } from '../api/solve'
import type { Campus, Algorithm, SolveResponse, Scene } from '../types'
import MapView from '../components/MapView'
import AlgorithmSelector from '../components/AlgorithmSelector'
import StatsPanel from '../components/StatsPanel'
import SceneSwitcher from '../components/SceneSwitcher'

interface SimulationProps {
  scene: Scene
  onSceneChange: (scene: Scene) => void
  onGoHome: () => void
}

// Simulation:VRP Dashboard 页面
// 逻辑与原 App.tsx 完全一致,仅在外层增加 SceneSwitcher
// 切换场景时重置 solveResult,避免展示上一场景的旧路线
function Simulation({ scene, onSceneChange, onGoHome }: SimulationProps) {
  // ---- 初始化数据 ----
  const [campus, setCampus] = useState<Campus | null>(null)
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([])

  // ---- 用户交互状态 ----
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('')
  const [solveResult, setSolveResult] = useState<SolveResponse | null>(null)

  // ---- 加载与错误状态 ----
  const [initLoading, setInitLoading] = useState<boolean>(true)
  const [solving, setSolving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // 页面加载时并发调用 /campus + /algorithms
  useEffect(() => {
    let cancelled = false

    async function loadInitData() {
      setInitLoading(true)
      setError(null)
      try {
        const [campusData, algorithmsData] = await Promise.all([
          getCampus(),
          getAlgorithms(),
        ])

        if (cancelled) return

        setCampus(campusData)
        setAlgorithms(algorithmsData)

        // 默认选中第一个算法,提升体验
        if (algorithmsData.length > 0) {
          setSelectedAlgorithm(algorithmsData[0].name)
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : '初始化数据加载失败')
      } finally {
        if (!cancelled) setInitLoading(false)
      }
    }

    loadInitData()

    return () => {
      cancelled = true
    }
  }, [])

  // 切换场景:清空求解结果
  function handleSceneChange(newScene: Scene) {
    onSceneChange(newScene)
    setSolveResult(null)
  }

  // 点击 Solve 按钮
  async function handleSolve() {
    if (!selectedAlgorithm) {
      setError('请先选择算法')
      return
    }

    setSolving(true)
    setError(null)
    try {
      const result = await solveApi(selectedAlgorithm)
      setSolveResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : '求解失败')
      setSolveResult(null)
    } finally {
      setSolving(false)
    }
  }

  return (
    <div className="app-container">
      {/* 左侧地图区域 */}
      <div className="map-section">
        {/* 左上角:返回首页 + 场景切换 */}
        <SceneSwitcher
          currentScene={scene}
          onSceneChange={handleSceneChange}
          onGoHome={onGoHome}
        />

        {campus ? (
          <MapView campus={campus} solveResult={solveResult} />
        ) : (
          <div className="placeholder">
            {initLoading ? '正在加载校园数据...' : '地图数据加载失败'}
          </div>
        )}
      </div>

      {/* 右侧控制面板 */}
      <div className="control-section">
        <h1>XATU VRP</h1>

        {/* 错误提示 */}
        {error && <div className="error">{error}</div>}

        {/* 初始化加载中 */}
        {initLoading && <p className="placeholder-inline">正在加载...</p>}

        {/* 主体内容:初始化完成后显示 */}
        {!initLoading && campus && (
          <>
            <div className="section-title">算法选择</div>
            <AlgorithmSelector
              algorithms={algorithms}
              value={selectedAlgorithm}
              onChange={setSelectedAlgorithm}
              disabled={solving}
            />
            <button
              onClick={handleSolve}
              disabled={solving || !selectedAlgorithm}
            >
              {solving ? '求解中...' : 'Solve'}
            </button>

            <div className="section-title" style={{ marginTop: 20 }}>
              求解结果
            </div>
            <StatsPanel solveResult={solveResult} solving={solving} />

            <div className="section-title" style={{ marginTop: 20 }}>
              校园数据
            </div>
            <div>
              <div className="stat-item">
                <span className="stat-label">Depot</span>
                <span className="stat-value">{campus.depot.name}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">客户点</span>
                <span className="stat-value">
                  {campus.customers.length} 个
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">车辆数</span>
                <span className="stat-value">
                  {campus.vehicles.length} 辆
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">单车容量</span>
                <span className="stat-value">
                  {campus.vehicles[0]?.capacity ?? '-'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Simulation
