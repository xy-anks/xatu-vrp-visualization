import { useEffect, useState } from 'react'
import { getCampus } from '../api/campus'
import { getAlgorithms } from '../api/algorithm'
import { solve as solveApi } from '../api/solve'
import type { Campus, Algorithm, SolveResponse, Scene, Order } from '../types'
import CampusImageMap from '../components/CampusImageMap'
import RealWorldMap from '../components/RealWorldMap'
import AlgorithmSelector from '../components/AlgorithmSelector'
import SimulationConfigPanel from '../components/SimulationConfigPanel'
import OrderPanel from '../components/OrderPanel'
import StatsPanel from '../components/StatsPanel'
import SceneSwitcher from '../components/SceneSwitcher'
import type { DeliveryStatus } from '../hooks/useDeliveryStatus'

interface SimulationProps {
  scene: Scene
  onSceneChange: (scene: Scene) => void
  onGoHome: () => void
}

// 当前后端已注册静态数据的场景
const SUPPORTED_MAP_SCENES: Scene[] = ['xatu-campus', 'real-world']

// 可配送节点类型(与后端 order_generator.ORDERABLE_NODE_TYPES 口径一致):
// xatu-campus 从宿舍(dorm)生成订单,real-world 从门店(store)生成订单
const ORDERABLE_NODE_TYPES: string[] = ['dorm', 'store']

// Simulation:VRP Dashboard 页面
// 数据链路:getCampus(scene) 加载静态场景 -> solve({scene, algorithm, config}) 求解
// 切换场景(scene prop 变化)是数据加载的唯一触发源,会重新拉取并清空旧路线
function Simulation({ scene, onSceneChange, onGoHome }: SimulationProps) {
  // ---- 初始化数据 ----
  const [campus, setCampus] = useState<Campus | null>(null)
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([])

  // ---- 仿真参数(Simulation Layer,随请求动态传入)----
  const [orderCount, setOrderCount] = useState<number>(10)
  const [vehicleCount, setVehicleCount] = useState<number>(3)
  const [capacity, setCapacity] = useState<number>(30)

  // ---- 用户交互状态 ----
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('')
  const [orders, setOrders] = useState<Order[]>([])
  const [solveResult, setSolveResult] = useState<SolveResponse | null>(null)

  // 配送状态(由地图内动画 hook 上报,驱动订单面板文字标签)
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>({
    deliveredCustomerIds: [],
    activeCustomerIds: [],
  })

  // ---- 加载与错误状态 ----
  const [initLoading, setInitLoading] = useState<boolean>(true)
  const [solving, setSolving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const mapSupported = SUPPORTED_MAP_SCENES.includes(scene)

  // 页面加载 / 切换场景时拉取数据
  // scene 是唯一触发源:场景变化 -> 重新加载该场景数据 + 清空上一场景的求解结果
  useEffect(() => {
    let cancelled = false

    async function loadInitData() {
      setInitLoading(true)
      setError(null)
      setSolveResult(null)

      try {
        // 算法列表与场景无关;campus 仅对已注册场景请求,其余返回 null(占位)
        const [algorithmsData, campusData] = await Promise.all([
          getAlgorithms(),
          mapSupported ? getCampus(scene) : Promise.resolve(null),
        ])

        if (cancelled) return

        setAlgorithms(algorithmsData)
        setCampus(campusData)

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
  }, [scene, mapSupported])

  // 切换场景:清空订单与求解结果(数据加载由上面的 effect 负责)
  function handleSceneChange(newScene: Scene) {
    onSceneChange(newScene)
    setSolveResult(null)
    setOrders([])
  }

  // 生成订单:基于 campus.customers 中可配送类型的节点随机生成,
  // orders 是求解的唯一订单数据源
  // - 只从可配送节点(ORDERABLE_NODE_TYPES:dorm/store)中抽样
  // - 随机选择 orderCount 个(数量不超过节点数时不重复抽样)
  // - demand 在 [1, 10] 内随机(与后端 order_generator 默认区间一致)
  // 生成后 Solve 以 custom 模式把这批订单原样提交给后端;
  // 不重新生成即可改车辆/容量/算法对同一批订单重复实验
  function handleGenerateOrders() {
    if (!campus) {
      setError('场景数据未加载,无法生成订单')
      return
    }

    const pool = campus.customers.filter((node) =>
      ORDERABLE_NODE_TYPES.includes(node.type)
    )

    if (pool.length === 0) {
      setError('场景中没有可配送节点,无法生成订单')
      return
    }
    const count = Math.max(1, orderCount)
    const selected: typeof pool = []

    if (count <= pool.length) {
      // 无放回抽样:先洗牌再取前 count 个,保证每个节点至多一单
      const shuffled = [...pool]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      selected.push(...shuffled.slice(0, count))
    } else {
      // 有放回抽样:订单数超过节点数时允许同一节点多单
      for (let i = 0; i < count; i++) {
        selected.push(pool[Math.floor(Math.random() * pool.length)])
      }
    }

    const nextOrders: Order[] = selected.map((node) => ({
      customer_id: node.id,
      customer_name: node.name,
      demand: Math.floor(Math.random() * 10) + 1,
    }))

    setOrders(nextOrders)
    setSolveResult(null)
    setError(null)
  }

  // 点击 Solve 按钮
  async function handleSolve() {
    if (orders.length === 0) {
      setError('请先生成订单')
      return
    }

    if (!selectedAlgorithm) {
      setError('请先选择算法')
      return
    }

    setSolving(true)
    setError(null)
    try {
      // custom 模式:前端生成的订单作为唯一数据源原样提交,
      // 后端不再随机生成;改车辆/容量/算法后可对同一批订单重复求解
      const result = await solveApi({
        scene,
        algorithm: selectedAlgorithm,
        config: {
          mode: 'custom',
          orders: orders.map((order) => ({
            customer_id: order.customer_id,
            demand: order.demand,
          })),
          vehicle_count: vehicleCount,
          capacity,
        },
      })
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

        {/* 地图渲染层按场景分派(互相独立):
            xatu-campus -> CampusImageMap(norm 坐标 -> SVG,含配送动画)
            real-world  -> RealWorldMap(lat/lng -> Leaflet,静态路线 + RouteSummary,
                         不接配送状态系统) */}
        {campus ? (
          scene === 'real-world' ? (
            <RealWorldMap
              campus={campus}
              solveResult={solveResult}
              orders={orders}
            />
          ) : (
            <CampusImageMap
              campus={campus}
              solveResult={solveResult}
              orders={orders}
              onDeliveryStatusChange={setDeliveryStatus}
            />
          )
        ) : (
          <div className="placeholder">
            {initLoading ? '正在加载场景数据...' : '地图数据加载失败'}
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
        {!initLoading && (
          <>
            <div className="section-title">仿真参数</div>
            <SimulationConfigPanel
              value={{ orderCount, vehicleCount, capacity }}
              onChange={(next) => {
                setOrderCount(next.orderCount)
                setVehicleCount(next.vehicleCount)
                setCapacity(next.capacity)
              }}
              disabled={solving || !mapSupported}
            />
            <button
              onClick={handleGenerateOrders}
              disabled={solving || !mapSupported || !campus}
            >
              生成订单
            </button>

            <div className="section-title" style={{ marginTop: 20 }}>
              订单
            </div>
            <OrderPanel
              orders={orders}
              deliveredCustomerIds={deliveryStatus.deliveredCustomerIds}
              activeCustomerIds={deliveryStatus.activeCustomerIds}
            />

            <div className="section-title" style={{ marginTop: 20 }}>
              算法选择
            </div>
            <AlgorithmSelector
              algorithms={algorithms}
              value={selectedAlgorithm}
              onChange={setSelectedAlgorithm}
              disabled={solving || !mapSupported}
            />
            <button
              onClick={handleSolve}
              disabled={solving || !selectedAlgorithm || !mapSupported}
            >
              {solving ? '求解中...' : 'Solve'}
            </button>

            <div className="section-title" style={{ marginTop: 20 }}>
              求解结果
            </div>
            <StatsPanel solveResult={solveResult} solving={solving} />

            <div className="section-title" style={{ marginTop: 20 }}>
              场景数据
            </div>
            <div>
              <div className="stat-item">
                <span className="stat-label">场景</span>
                <span className="stat-value">{scene}</span>
              </div>
              {campus && (
                <>
                  <div className="stat-item">
                    <span className="stat-label">Depot</span>
                    <span className="stat-value">{campus.depot.name}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">候选节点</span>
                    <span className="stat-value">
                      {campus.customers.length} 个
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Simulation
