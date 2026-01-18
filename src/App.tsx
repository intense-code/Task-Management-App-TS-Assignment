import Tasks from "./components/tasks/Tasks"
import "./App.css"
import { TaskProvider, useTaskContext } from "./context/TaskContext"
import Nav from "./components/Nav"
const AppContent = () => {
  const { state } = useTaskContext()

  return (
    <>
      <Nav />
      <Tasks task={state.task} />
    </>
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
