import type { TaskState } from "./reducer/TasksReducer"
import type Task from "./model/Tasks.model"

type SerializedTask = Omit<Task, "enteredDate" | "notificationDate" | "deadline"> & {
  enteredDate: string
  notificationDate: string
  deadline: string
}

type SerializedTaskState = {
  task: SerializedTask
  tasks: SerializedTask[]
}

export {}

declare global {
  interface Window {
    desktop?: {
      tasks?: {
        read: () => Promise<TaskState>
        write: (payload: SerializedTaskState) => Promise<{ ok: true }>
      }
    }
  }
}
