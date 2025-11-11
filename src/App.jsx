import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Альфа-Будущее</h1>
        <p>Ваш ИИ-помощник для малого бизнеса</p>
      </header>
      <main className="app-main">
        <div className="welcome-card">
          <h2>Добро пожаловать!</h2>
          <div className="features">
            <div className="feature-item">Умный помощник</div>
            <div className="feature-item">Бизнес-консультации</div>
            <div className="feature-item">Быстрые ответы</div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App