import Tasks from './components/tasks/Tasks'
import './App.css'
import { TaskProvider, useTaskContext } from "./context/TaskContext"

const AppContent = () => {
  const { state } = useTaskContext()

  return (
    <>
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
