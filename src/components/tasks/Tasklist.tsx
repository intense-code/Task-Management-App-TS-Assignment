import "./tasks.model.css"
import { useTaskContext } from "../../context/TaskContext"
type dateStrings = {
    time: string;
    date: string;
}

const Tasklist: React.FC = () => {
  const { state, dispatch } = useTaskContext()
// If no task are made at that point
  if (state.tasks.length === 0) {
    return <div className="taskindex">No tasks available. Please add a task.</div>
  }

  return (
    <div className="taskindex tasklist">
      {state.tasks.map((task, index) => {
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
              <strong>{task.name}</strong>
              <div>{task.details}</div>
              <div>
                <label>Notification Date: </label>
                {notifyDate.date} {notifyDate.time}
              </div>
              <div>
                <label>Dead-line Date: </label>
                {deadlineDate.date} {deadlineDate.time}
              </div>
              <div>
                <label>Finished: </label>
                <input type="checkbox" checked={task.finished} readOnly />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "remove_task",
                      payload: task.enteredDate.getTime(),
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
