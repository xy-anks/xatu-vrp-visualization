import { useState, useRef, useEffect } from 'react'
import { SCENES, type Scene } from '../types'

interface SceneSwitcherProps {
  currentScene: Scene
  onSceneChange: (scene: Scene) => void
  onGoHome: () => void
}

// SceneSwitcher:左上角场景切换控件
// 布局:[← Home] [ 🌍 Real World ▼ ]
// 点击 ▼ 展开下拉列表,可切换场景
function SceneSwitcher({
  currentScene,
  onSceneChange,
  onGoHome,
}: SceneSwitcherProps) {
  const [open, setOpen] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const current = SCENES.find((s) => s.id === currentScene) ?? SCENES[0]

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(scene: Scene) {
    if (scene !== currentScene) {
      onSceneChange(scene)
    }
    setOpen(false)
  }

  return (
    <div className="scene-switcher-wrapper" ref={containerRef}>
      {/* 返回首页按钮 */}
      <button className="home-back-btn" onClick={onGoHome} title="返回首页">
        ← Home
      </button>

      {/* 场景切换按钮 */}
      <button
        className={`scene-switcher-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="scene-emoji">{current.emoji}</span>
        <span className="scene-label">
          {current.id === 'real-world' ? 'Real World' : 'XATU Campus'}
        </span>
        <span className="scene-arrow">▼</span>
      </button>

      {/* 下拉选项 */}
      {open && (
        <div className="scene-dropdown">
          {SCENES.map((scene) => (
            <button
              key={scene.id}
              className={`scene-option ${scene.id === currentScene ? 'active' : ''}`}
              onClick={() => handleSelect(scene.id)}
            >
              <span className="scene-option-emoji">{scene.emoji}</span>
              <span className="scene-option-text">
                <strong>{scene.title}</strong>
                <br />
                <small>{scene.subtitle}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SceneSwitcher
