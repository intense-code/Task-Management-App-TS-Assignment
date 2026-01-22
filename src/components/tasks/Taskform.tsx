import { fromLocalInput, toLocalInput } from "../../utils/helpers"
import { useTaskContext } from "../../context/TaskContext"

const TaskForm: React.FC = () => {
  const { state, dispatch } = useTaskContext()
  const { task } = state

  const addTask = (e: React.FormEvent) => {
    e.preventDefault()
    const newTask = { ...task, enteredDate: new Date() }
    dispatch({ type: "add_task", payload: newTask })
    dispatch({ type: "reset_current" })
  }

  return (
    <div className="taskcard">
      <form onSubmit={addTask}>
        <div className="taskrow">
          <h3>Task Accomplisher</h3>
        </div>
        <div className="taskrow">
        <div className="taskindex">
          <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          placeholder="name"
          value={task.name}
          onChange={(e) =>
            dispatch({ type: "update_current", payload: { name: e.target.value } })
          }
        />
        <label htmlFor="finished">Finished</label>
          <input
          type="checkbox"
          id="finished"
          checked={task.finished}
          onChange={(e) =>
            dispatch({ type: "update_current", payload: { finished: e.target.checked } })
          }
        />
        <label htmlFor="reschedule">Reschedule after completed</label>
        <input
          type="checkbox"
          id="reschedule"
          checked={task.reschedule_after_completed}
          onChange={(e) =>
            dispatch({
              type: "update_current",
              payload: { reschedule_after_completed: e.target.checked },
            })
          }
        />
        <button id="submit" type="submit">Add Task</button>
        </div>
        <div className="taskindex">
          <label htmlFor="details">Details</label>
        <textarea
          id="details"
          placeholder="details"
          value={task.details}
          onChange={(e) =>
            dispatch({ type: "update_current", payload: { details: e.target.value } })
          }
        />
        </div>
        <div className="taskindex">
        
        <label htmlFor="notify-at">Notification</label>
        <input
          id="notify-at"
          type="datetime-local"
          value={task.notificationDate ? toLocalInput(task.notificationDate) : ""}
          onChange={(e) =>
            dispatch({
              type: "update_current",
              payload: {
                notificationDate: e.target.value ? fromLocalInput(e.target.value) : new Date(),
              },
            })
          }
        />
        <label htmlFor="notify-by">Due Date</label>
        <input
          id="notify-by"
          type="datetime-local"
          value={task.deadline ? toLocalInput(task.deadline) : ""}
          onChange={(e) =>
            dispatch({
              type: "update_current",
              payload: {
                deadline: e.target.value ? fromLocalInput(e.target.value) : new Date(),
              },
            })
          }
        />
        
        </div>
        </div>
      </form>
    </div>
  )
}

export default TaskForm
