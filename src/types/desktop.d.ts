import type { TaskState } from "../reducer/TasksReducer";

type PersistedTask = Omit<TaskState["task"], "enteredDate" | "notificationDate" | "deadline"> & {
  enteredDate: string;
  notificationDate: string;
  deadline: string;
};

type PersistedTaskState = {
  task: PersistedTask;
  tasks: PersistedTask[];
};

declare global {
  interface Window {
    desktop?: {
      getTasks?: () => Promise<PersistedTaskState>;
      saveTasks?: (payload: PersistedTaskState) => Promise<{ ok: boolean } | void>;
    };
  }
}

export {};
