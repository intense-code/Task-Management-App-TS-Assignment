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
      notify_pressed: Boolean(task.notify_pressed),
      deadline_pressed: Boolean(task.deadline_pressed),
      reschedule_after_completed: Boolean(task.reschedule_after_completed),
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

  useEffect(() => {
    if (!initialized) return
    const timers = new Map<number, NodeJS.Timeout>()

    state.tasks.forEach((task) => {
      if (!task.reschedule_after_completed || !task.finished) return
      const when = task.notificationDate.getTime()
      const delay = when - Date.now()
      const id = task.enteredDate.getTime()

      const schedule = () => dispatch({ type: "reschedule_task", payload: id })
      if (delay <= 0) {
        schedule()
        return
      }
      timers.set(id, setTimeout(schedule, delay))
    })

    return () => {
      for (const [, t] of timers) clearTimeout(t)
    }
  }, [initialized, state.tasks, dispatch])

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
