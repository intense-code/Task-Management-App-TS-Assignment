
import {toLocalInput} from '../../utils/helpers'
const TaskForm: React.FC = () =>{

const addTask = (e: React.FormEvent) =>{
    e.preventDefault();
    setTask({...task,enteredDate: new Date()})
}
    return(
        <div className="taskindex">
            <form onSubmit={addTask}>
                <label htmlFor="name">Name</label>
                <input type="text"
                    id="name"
                    placeholder="name"
                    value={task?.name}
                    onChange={(e)=>setTask({...task,name:e.target.value})}
                    />
                <label htmlFor="details">Details</label>
                <input type="text"
                    id="details"
                    placeholder="details"
                    value={task?.details}
                    onChange={(e)=>setTask({...task,details:e.target.value})}
                    />
                <label htmlFor="finished">Finished</label>
                <input type="checkbox"
                    id="finished"
                    checked={task.finished}
                    onChange={(e)=>setTask({...task,finished:e.target.checked})}
                    />
                <label htmlFor="remove">Remove</label>
                <input type="checkbox"
                    id="remove"
                    checked={task.remove}
                    onChange={(e)=>setTask({...task,remove:e.target.checked})}
                    />
                <label htmlFor="notify-at">Notification</label>
                <input
                id="notify-at"
                type="datetime-local"
                value={task.notificationDate ? toLocalInput(task.notificationDate) : ""}
                onChange={(e) =>
                    setTask({
                    ...task,
                    notificationDate: e.target.value ? new Date(e.target.value) : new Date(),
                    })
                }
                />
                <label htmlFor="notify-by">Due Date</label>
                <input
                id="notify-by"
                type="datetime-local"
                value={task.deadline ? toLocalInput(task.deadline) : ""}
                onChange={(e) =>
                    setTask({
                    ...task,
                    deadline: e.target.value ? new Date(e.target.value) : new Date(),
                    })
                }
                />
                <button type="submit">Add Task</button>

            </form>
        </div>
    )
}
export default TaskForm