import { useState } from "react"
import "./tasks.model.css"
import { useTaskContext } from "../../context/TaskContext"
import { toLocalInput } from "../../utils/helpers"
type dateStrings = {
    time: string;
    date: string;
}

const Tasklist: React.FC = () => {
  const { state, dispatch, initialized } = useTaskContext()
  const [editing, setEditing] = useState<{
    id: number
    field: "name" | "details" | "notificationDate" | "deadline"
  } | null>(null)
  if (!initialized) {
    return <div className="taskindex">Loading tasks...</div>
  }
// If no task are made at that point
  if (state.tasks.length === 0) {
    return <div className="taskindex">No tasks available. Please add a task.</div>
  }

  return (
    <div className="taskindex tasklist">
      {state.tasks.map((task, index) => {
        const taskId:number = task.enteredDate.getTime()
        // Notification Time
            const notifyDate: dateStrings = {
  date: task.notificationDate.toLocaleDateString(),
  time: task.notificationDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
}       // Due Date Time deadline
         const deadlineDate: dateStrings = {
  date: task.deadline.toLocaleDateString(),
  time: task.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
} 
        return (
          <div key={`${task.name}-${index}`} className="tasklist-item">
            <div>
              {editing?.id === taskId && editing.field === "name" ? (
                <input
                  type="text"
                  value={task.name}
                  autoFocus
                  onChange={(e) =>
                    dispatch({
                      type: "update_task",
                      payload: { id: taskId, changes: { name: e.target.value } },
                    })
                  }
                  onBlur={() => setEditing(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditing(null)
                    }
                  }}
                />
              ) : (
                <strong onClick={() => setEditing({ id: taskId, field: "name" })}>
                  {task.name}
                </strong>
              )}
              {editing?.id === taskId && editing.field === "details" ? (
                <textarea
                  value={task.details}
                  autoFocus
                  onChange={(e) =>
                    dispatch({
                      type: "update_task",
                      payload: { id: taskId, changes: { details: e.target.value } },
                    })
                  }
                  onBlur={() => setEditing(null)}
                />
              ) : (
                <div onClick={() => setEditing({ id: taskId, field: "details" })}>
                  {task.details}
                </div>
              )}
              <div>
                <label>Notification Date: </label>
                {editing?.id === taskId && editing.field === "notificationDate" ? (
                  <input
                    type="datetime-local"
                    value={toLocalInput(task.notificationDate)}
                    autoFocus
                    onChange={(e) =>
                      dispatch({
                        type: "update_task",
                        payload: {
                          id: taskId,
                          changes: {
                            notificationDate: e.target.value
                              ? new Date(e.target.value)
                              : new Date(),
                          },
                        },
                      })
                    }
                    onBlur={() => setEditing(null)}
                  />
                ) : (
                  <span
                    onClick={() => setEditing({ id: taskId, field: "notificationDate" })}
                  >
                    {notifyDate.date} {notifyDate.time}
                  </span>
                )}
              </div>
              <div>
                <label>Dead-line Date: </label>
                {editing?.id === taskId && editing.field === "deadline" ? (
                  <input
                    type="datetime-local"
                    value={toLocalInput(task.deadline)}
                    autoFocus
                    onChange={(e) =>
                      dispatch({
                        type: "update_task",
                        payload: {
                          id: taskId,
                          changes: {
                            deadline: e.target.value
                              ? new Date(e.target.value)
                              : new Date(),
                          },
                        },
                      })
                    }
                    onBlur={() => setEditing(null)}
                  />
                ) : (
                  <span onClick={() => setEditing({ id: taskId, field: "deadline" })}>
                    {deadlineDate.date} {deadlineDate.time}
                  </span>
                )}
              </div>
              <div>
                <label>Finished: </label>
                <input
                  type="checkbox"
                  checked={task.finished}
                  onChange={(e) =>
                    dispatch({
                      type: "update_task",
                      payload: { id: taskId, changes: { finished: e.target.checked } },
                    })
                  }
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "remove_task",
                      payload: taskId,
                    })
                  }
                >
                  Remove
                </button>
              </div>

            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Tasklist
