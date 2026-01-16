import type Task  from "../../model/Tasks.model"
import 'tasks.model.css'
import TaskForm from "./TaskForm"
type tasksProp = {task: Task}
const Tasks: React.FC<tasksProp> = ({task}) =>{

    return (
        <>Tasks
        <TaskForm />
        <div className="taskindex">
            {task.name}
            <div>
                {task.details}
            </div>
        
        </div>
        </>
    )
}
export default Tasks