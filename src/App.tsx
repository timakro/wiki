import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <button
        type="button"
        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-lg shadow-lg hover:bg-indigo-500 active:scale-95 transition-all cursor-pointer"
        onClick={() => setCount((c) => c + 1)}
      >
        Count is {count}
      </button>
    </div>
  )
}

export default App
