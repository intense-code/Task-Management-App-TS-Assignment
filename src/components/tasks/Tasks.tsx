import type Task  from "../../model/Tasks.model"
import './tasks.model.css'
import Taskform from "./Taskform"
import Tasklist from "./Tasklist"
type tasksProp = {task: Task}


const Tasks: React.FC<tasksProp> = ({task}) =>{


    return (
        <>
        <Taskform />
        <Tasklist />
        {console.log(task.name)}
        </>
    )
}
export default Tasks
