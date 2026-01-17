import { createContext, useContext, useReducer } from "react"
import type { Dispatch, ReactNode } from "react"
import { initialState, taskReducer } from "../reducer/TasksReducer"
import type { TaskAction, TaskState } from "../reducer/TasksReducer"

type TaskContextValue = {
  state: TaskState
  dispatch: Dispatch<TaskAction>
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState)

  return <TaskContext.Provider value={{ state, dispatch }}>{children}</TaskContext.Provider>
}

export const useTaskContext = () => {
  const ctx = useContext(TaskContext)
  if (!ctx) {
    throw new Error("useTaskContext must be used within TaskProvider")
  }
  return ctx
}
