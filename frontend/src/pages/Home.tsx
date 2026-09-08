import { SCENES, type Scene } from '../types'

interface HomeProps {
  onStart: (scene: Scene) => void
}

// Home:首页入口
// 居中布局,两个大按钮选择仿真场景
function Home({ onStart }: HomeProps) {
  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-title">Logistics Simulation Platform</h1>
        <p className="home-subtitle">
          连接真实世界与数字校园,
          <br />
          探索智能配送的无限可能
        </p>

        <p className="home-hint">选择一个仿真环境开始探索</p>

        <div className="home-scene-list">
          {SCENES.map((scene) => (
            <button
              key={scene.id}
              className="home-scene-btn"
              onClick={() => onStart(scene.id)}
            >
              <span className="home-scene-emoji">{scene.emoji}</span>
              <span className="home-scene-text">
                <strong>{scene.title}</strong>
                <br />
                <small>{scene.subtitle}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
