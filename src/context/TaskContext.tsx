import { createContext, useContext, useEffect, useReducer, useState } from "react"
import type { Dispatch, ReactNode } from "react"
import type Task from "../model/Tasks.model"
import { initialState, taskReducer } from "../reducer/TasksReducer"
import type { TaskAction, TaskState } from "../reducer/TasksReducer"

type TaskContextValue = {
  state: TaskState
  dispatch: Dispatch<TaskAction>
  initialized: boolean
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const reviveTask = (task: Task): Task => ({
      ...task,
      enteredDate: new Date(task.enteredDate),
      notificationDate: new Date(task.notificationDate),
      deadline: new Date(task.deadline),
    })

    const load = async () => {
      try {
        const res = await fetch("/api/tasks")
        if (!res.ok) {
          throw new Error("Failed to load tasks")
        }
        const data = (await res.json()) as TaskState
        const nextState: TaskState = {
          task: data?.task ? reviveTask(data.task) : initialState.task,
          tasks: Array.isArray(data?.tasks) ? data.tasks.map(reviveTask) : [],
        }
        dispatch({ type: "set_state", payload: nextState })
      } catch {
        // Use initial state if tasks.json cannot be read
      } finally {
        setInitialized(true)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!initialized) {
      return
    }
    const serializeTask = (task: Task) => ({
      ...task,
      enteredDate: task.enteredDate.toISOString(),
      notificationDate: task.notificationDate.toISOString(),
      deadline: task.deadline.toISOString(),
    })
    const payload = {
      task: serializeTask(state.task),
      tasks: state.tasks.map(serializeTask),
    }
    fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Ignore persistence errors
    })
  }, [initialized, state])

  return (
    <TaskContext.Provider value={{ state, dispatch, initialized }}>
      {children}
    </TaskContext.Provider>
  )
}

export const useTaskContext = () => {
  const ctx = useContext(TaskContext)
  if (!ctx) {
    throw new Error("useTaskContext must be used within TaskProvider")
  }
  return ctx
}
