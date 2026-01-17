import type Task  from "../../model/Tasks.model"
import './tasks.model.css'
import Taskform from "./Taskform"
type tasksProp = {task: Task}
type dateStrings = {
    time: string;
    date: string;
}

const Tasks: React.FC<tasksProp> = ({task}) =>{
    const dateStrings: dateStrings = {
  date: task.notificationDate.toLocaleDateString(),
  time: task.notificationDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
}

    return (
        <>
        <Taskform />
        <div>
            {task.name}
            
                {task.details}
            
            <div className="taskrow">
                {dateStrings.date}
                
            </div>
            <div className="taskrow">
            {dateStrings.time}    
            </div>            
        
        </div>
        </>
    )
}
export default Tasks