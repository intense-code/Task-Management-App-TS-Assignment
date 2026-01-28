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
  | { type: "reschedule_task"; payload: number }
  | { type: "notify_pressed"; payload: boolean }
  | { type: "deadline_pressed"; payload: boolean }
export const initialTask: Task = {
  name: "",
  details: "",
  finished: false,
  remove: false,
  enteredDate: new Date(),
  notificationDate: new Date(),
  deadline: new Date(),
  notify_pressed: false,
  deadline_pressed: false,
  reschedule_after_completed: false
}

export const initialState: TaskState = {
  task: initialTask,
  tasks: [],
}

export const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  const applyDateRules = (task: Task, changes: Partial<Task>) => {
    let next = { ...task, ...changes };
    let notifyPressed = task.notify_pressed;
    let deadlinePressed = task.deadline_pressed;

    if ("notificationDate" in changes) {
      notifyPressed = true;
      if (!deadlinePressed) {
        next = { ...next, deadline: next.notificationDate };
      }
    }

    if ("deadline" in changes) {
      deadlinePressed = true;
    }

    if ("finished" in changes && changes.finished && next.reschedule_after_completed) {
      const nextTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      next = {
        ...next,
        finished: false,
        notificationDate: nextTime,
        deadline: deadlinePressed ? next.deadline : nextTime
      };
      notifyPressed = true;
    }

    return {
      ...next,
      notify_pressed: notifyPressed,
      deadline_pressed: deadlinePressed
    };
  };

  switch (action.type) {
    // Can take partial fields and updates to the existing task so you dont have to provide a full new task only the fields that change
    case "update_current":
      return { ...state, task: applyDateRules(state.task, action.payload) }
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
        tasks: state.tasks.flatMap((tsk) => {
          if (tsk.enteredDate.getTime() !== action.payload.id) return [tsk]

          const changes = action.payload.changes
          const finishedNow =
            "finished" in changes ? Boolean(changes.finished) : tsk.finished
          const rescheduleEnabled =
            "reschedule_after_completed" in changes
              ? Boolean(changes.reschedule_after_completed)
              : tsk.reschedule_after_completed
          const shouldReschedule = finishedNow && rescheduleEnabled

          if (!shouldReschedule) {
            return [applyDateRules(tsk, changes)]
          }

          const nextTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
          const deadlinePressed = tsk.deadline_pressed
          const nextTask: Task = {
            ...tsk,
            finished: false,
            remove: false,
            enteredDate: new Date(),
            notificationDate: nextTime,
            deadline: deadlinePressed ? tsk.deadline : nextTime,
            notify_pressed: true,
            deadline_pressed: deadlinePressed
          }

          return [nextTask]
        }),
      }
    case "reschedule_task": {
      const nextTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      return {
        ...state,
        tasks: state.tasks.flatMap((tsk) => {
          if (tsk.enteredDate.getTime() !== action.payload) return [tsk]
          const deadlinePressed = tsk.deadline_pressed
          const nextTask: Task = {
            ...tsk,
            finished: false,
            remove: false,
            enteredDate: new Date(),
            notificationDate: nextTime,
            deadline: deadlinePressed ? tsk.deadline : nextTime,
            notify_pressed: true,
            deadline_pressed: deadlinePressed
          }
          return [nextTask]
        }),
      }
    }
    case "notify_pressed":
      return { ...state, task: { ...state.task, notify_pressed: action.payload } }
    case "deadline_pressed":
      return { ...state, task: { ...state.task, deadline_pressed: action.payload } }
    default:
      return state
  }
}
