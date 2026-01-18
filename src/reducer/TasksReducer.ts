import type Task from "../model/Tasks.model"

export type TaskState = {
  task: Task
  tasks: Task[]
}

export type TaskAction =
  | { type: "update_current"; payload: Partial<Task> }
  | { type: "set_current"; payload: Task }
  | { type: "set_state"; payload: TaskState }
  | { type: "add_task"; payload: Task }
  | { type: "reset_current" }
  | { type: "remove_task"; payload: number }
  | { type: "update_task"; payload: { id: number; changes: Partial<Task> } }

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
  tasks: [],
}

export const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    // Can take partial fields and updates to the existing task so you dont have to provide a full new task only the fields that change
    case "update_current":
      return { ...state, task: { ...state.task, ...action.payload } }
    // Replaces the entire task with the payload so you must provide a full new task
    case "set_current":
      return { ...state, task: action.payload }
    case "set_state":
      return action.payload
    // Add a full new task
      case "add_task":
      return { ...state, tasks: [...state.tasks, action.payload] }
    // Reset the current task as the initialTask which is default task   
    case "reset_current":
      return { ...state, task: initialTask }
    case "remove_task":
      return {
        ...state,
        tasks: state.tasks.filter(
          (tsk) => tsk.enteredDate.getTime() !== action.payload
        ),
      }
    case "update_task":
      return {
        ...state,
        tasks: state.tasks.map((tsk) =>
          tsk.enteredDate.getTime() === action.payload.id
            ? { ...tsk, ...action.payload.changes }
            : tsk
        ),
      }
    default:
      return state
  }
}
