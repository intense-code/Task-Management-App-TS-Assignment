import { useEffect, useState } from "react"
import Tasks from "./components/tasks/Tasks"
import "./App.css"
import { Navigate, Route, Routes } from "react-router-dom"
import { TaskProvider } from "./context/TaskContext"
import Nav from "./components/nav/Nav"
import LandingPage from "./LandingPage"
import { useSkin } from "./hooks/useSkin"

type AuthStatus = "loading" | "authed" | "guest"

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>("loading")

  useEffect(() => {
    let alive = true
    const api = import.meta.env.VITE_API_URL
    const check = async () => {
      try {
        const res = await fetch(`${api}/me`, { credentials: "include" })
        if (!alive) return
        setStatus(res.ok ? "authed" : "guest")
      } catch {
        if (!alive) return
        setStatus("guest")
      }
    }
    check()
    return () => {
      alive = false
    }
  }, [])

  if (status === "loading") {
    return <div className="app-shell">Checking session...</div>
  }
  if (status === "guest") {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
const TaskApp = () => {
  const { skin, setSkin } = useSkin()

  return (
    <div className="app-shell">
      <Nav skin={skin} setSkin={setSkin} />
      <Tasks />
    </div>
  )
}

function App() {
  return (
    <TaskProvider>
      <Routes>
        <Route
          path="/taskapp"
          element={
            <RequireAuth>
              <TaskApp />
            </RequireAuth>
          }
        />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </TaskProvider>
  )
}

export default App
