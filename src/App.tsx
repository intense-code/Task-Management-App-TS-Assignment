import Tasks from "./components/tasks/Tasks"
import "./App.css"
import { TaskProvider, useTaskContext } from "./context/TaskContext"
import Nav from "./components/Nav"
import { useSkin } from "./hooks/useSkin"
const AppContent = () => {
  const { state } = useTaskContext()
  const { skin, setSkin } = useSkin()

  return (
    <div className="app-shell">
      <Nav skin={skin} setSkin={setSkin} />
      <Tasks task={state.task} />
    </div>
  )
}

function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  )
}

export default App
