import { useState, memo, useMemo, useCallback, lazy, Suspense } from 'react'
import './index.css'

const LazyPanel = lazy(() => new Promise(resolve => {
  setTimeout(() => resolve({
    default: function LazyContent() {
      return (
        <div className="lazy-content">
          <div className="lazy-badge">LAZY LOADED</div>
          <p className="lazy-text">
            This component loaded on demand via <code>React.lazy()</code> and <code>Suspense</code>.
            It was not in the initial bundle — only fetched when you triggered it.
          </p>
          <div className="lazy-stats">
            <div className="lazy-stat">
              <span className="lazy-stat-val">0ms</span>
              <span className="lazy-stat-key">Initial bundle impact</span>
            </div>
            <div className="lazy-stat">
              <span className="lazy-stat-val">On demand</span>
              <span className="lazy-stat-key">Load strategy</span>
            </div>
          </div>
        </div>
      )
    }
  }), 1400)
}))

const MemoizedChild = memo(function MemoizedChild({ value, parentTick }) {
  return (
    <div className="demo-child memo">
      <span className="child-label">MEMOIZED</span>
      <span className="child-detail">Skips render when props unchanged</span>
      <span className="child-val">value: <strong>{value}</strong></span>
      <span className="child-val">parent ticks seen: <strong>{parentTick}</strong></span>
    </div>
  )
})

function UnmemoizedChild({ value, parentTick }) {
  return (
    <div className="demo-child plain">
      <span className="child-label">UNMEMOIZED</span>
      <span className="child-detail">Re-renders on every parent render</span>
      <span className="child-val">value: <strong>{value}</strong></span>
      <span className="child-val">parent ticks seen: <strong>{parentTick}</strong></span>
    </div>
  )
}

function MemoPanel() {
  const [tick, setTick] = useState(0)
  const [childVal, setChildVal] = useState('hello')
  const [memoTick, setMemoTick] = useState(0)

  const handleRerender = () => {
    setTick(t => t + 1)
    setMemoTick(t => t + 1)
  }

  const handleChangeValue = () => {
    setChildVal(v => v === 'hello' ? 'world' : 'hello')
    setTick(t => t + 1)
    setMemoTick(t => t + 1)
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-tag">01</span>
        <h2 className="panel-title">React.memo</h2>
        <span className="panel-sub">Skip renders when props unchanged</span>
      </div>
      <div className="panel-body">
        <p className="panel-desc">
          Click <em>Re-render Parent</em> — the memoized child props did not change so it skips.
          Click <em>Change Value</em> and both children update because props changed.
        </p>
        <div className="demo-children">
          <MemoizedChild value={childVal} parentTick={memoTick} />
          <UnmemoizedChild value={childVal} parentTick={tick} />
        </div>
        <div className="demo-controls">
          <button className="ctrl-btn" onClick={handleRerender}>
            Re-render Parent <span className="ctrl-count">{tick}</span>
          </button>
          <button className="ctrl-btn ctrl-btn--alt" onClick={handleChangeValue}>
            Change Value
          </button>
        </div>
      </div>
    </div>
  )
}

function UseMemoPanel() {
  const [count, setCount] = useState(1)
  const [unrelated, setUnrelated] = useState(0)
  const [log, setLog] = useState(['Waiting for computation...'])

  const expensive = useMemo(() => {
    const result = Array.from({ length: count * 1000 }, (_, i) => i).reduce((a, b) => a + b, 0)
    return result
  }, [count])

  const handleCount = () => {
    setCount(c => {
      const next = c + 1
      setLog(prev => [`Computed at count=${next}`, ...prev.slice(0, 3)])
      return next
    })
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-tag">02</span>
        <h2 className="panel-title">useMemo</h2>
        <span className="panel-sub">Cache expensive computations</span>
      </div>
      <div className="panel-body">
        <p className="panel-desc">
          The sum of <code>count x 1000</code> numbers is memoized. <em>Unrelated Update</em> re-renders without recomputing.
          Only changing count triggers a new computation.
        </p>
        <div className="memo-result">
          <span className="memo-result-label">Cached Result</span>
          <span className="memo-result-val">{expensive.toLocaleString()}</span>
        </div>
        <div className="compute-log">
          {log.map((entry, i) => (
            <div key={i} className={`log-entry ${i === 0 ? 'log-entry--active' : ''}`}>{entry}</div>
          ))}
        </div>
        <div className="demo-controls">
          <button className="ctrl-btn" onClick={handleCount}>
            Increase Count <span className="ctrl-count">{count}</span>
          </button>
          <button className="ctrl-btn ctrl-btn--alt" onClick={() => setUnrelated(u => u + 1)}>
            Unrelated Update <span className="ctrl-count">{unrelated}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function UseCallbackPanel() {
  const [count, setCount] = useState(0)
  const [useStable, setUseStable] = useState(true)
  const [log, setLog] = useState([])

  const stableCallback = useCallback(() => {
    setCount(c => c + 1)
    setLog(prev => [`Called stable ref — same function object`, ...prev.slice(0, 4)])
  }, [])

  const handleUnstable = () => {
    setCount(c => c + 1)
    setLog(prev => [`Called inline fn — new object this render`, ...prev.slice(0, 4)])
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-tag">03</span>
        <h2 className="panel-title">useCallback</h2>
        <span className="panel-sub">Stable function references across renders</span>
      </div>
      <div className="panel-body">
        <p className="panel-desc">
          Without <code>useCallback</code>, every render creates a new function reference — breaking
          memoized children that receive it as a prop. Toggle between strategies to compare.
        </p>
        <div className="callback-compare">
          <div className={`callback-box ${useStable ? 'active' : ''}`}>
            <span className="callback-label">useCallback</span>
            <span className="callback-desc">Same reference every render</span>
          </div>
          <div className={`callback-box ${!useStable ? 'active' : ''}`}>
            <span className="callback-label">Inline function</span>
            <span className="callback-desc">New reference every render</span>
          </div>
        </div>
        <div className="compute-log">
          {log.length === 0 && <div className="log-entry">Call the function to see logs...</div>}
          {log.map((entry, i) => (
            <div key={i} className={`log-entry ${i === 0 ? 'log-entry--active' : ''}`}>{entry}</div>
          ))}
        </div>
        <div className="demo-controls">
          <button className="ctrl-btn" onClick={useStable ? stableCallback : handleUnstable}>
            Call Function <span className="ctrl-count">{count}</span>
          </button>
          <button className="ctrl-btn ctrl-btn--alt" onClick={() => setUseStable(s => !s)}>
            Using: {useStable ? 'useCallback' : 'Inline fn'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LazyLoadPanel() {
  const [show, setShow] = useState(false)

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-tag">04</span>
        <h2 className="panel-title">React.lazy + Suspense</h2>
        <span className="panel-sub">Code splitting on demand</span>
      </div>
      <div className="panel-body">
        <p className="panel-desc">
          Heavy components can be split into separate chunks and loaded only when needed.
          Click the button — watch the fallback appear, then the component loads.
        </p>
        {!show && (
          <button className="ctrl-btn ctrl-btn--full" onClick={() => setShow(true)}>
            Load Component
          </button>
        )}
        {show && (
          <Suspense fallback={
            <div className="lazy-fallback">
              <div className="lazy-spinner" />
              <span>Loading chunk...</span>
            </div>
          }>
            <LazyPanel />
          </Suspense>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="brand">FORGE</div>
            <div className="brand-sub">React Performance Lab</div>
          </div>
          <div className="header-pills">
            {['memo', 'useMemo', 'useCallback', 'lazy'].map(t => (
              <span key={t} className="pill">{t}</span>
            ))}
          </div>
        </div>
      </header>
      <main className="main">
        <div className="grid">
          <MemoPanel />
          <UseMemoPanel />
          <UseCallbackPanel />
          <LazyLoadPanel />
        </div>
      </main>
      <footer className="footer">
        <span>Day 39 · Performance & Best Practices · Forge</span>
      </footer>
    </div>
  )
}

export default App