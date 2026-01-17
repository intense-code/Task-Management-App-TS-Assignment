import type Task from "../model/Tasks.model"

export type TaskState = {
  task: Task
}

export type TaskAction =
  | { type: "update"; payload: Partial<Task> }
  | { type: "reset"; payload?: Task }

export const initialTask: Task = {
  name: "",
  details: "",
  finished: false,
  remove: false,
  enteredDate: new Date(),
  notificationDate: new Date(),
  deadline: new Date(),
}

export const initialState: TaskState = {
  task: initialTask,
}

export const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case "update":
      return { task: { ...state.task, ...action.payload } }
    case "reset":
      return { task: action.payload ?? initialTask }
    default:
      return state
  }
}
