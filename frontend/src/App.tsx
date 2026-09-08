import { useState } from 'react'
import type { Scene } from './types'
import Home from './pages/Home'
import Simulation from './pages/Simulation'

// App:顶层路由壳
// 用 useState 管理当前页面与场景,不引入 React Router
//   - currentPage: 'home' | 'simulation'
//   - currentScene: Scene
type Page = 'home' | 'simulation'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [currentScene, setCurrentScene] = useState<Scene>('xatu-campus')

  // 从首页进入仿真:保存场景 + 切换页面
  function handleStart(scene: Scene) {
    setCurrentScene(scene)
    setCurrentPage('simulation')
  }

  // 返回首页
  function handleGoHome() {
    setCurrentPage('home')
  }

  if (currentPage === 'home') {
    return <Home onStart={handleStart} />
  }

  return (
    <Simulation
      scene={currentScene}
      onSceneChange={setCurrentScene}
      onGoHome={handleGoHome}
    />
  )
}

export default App
