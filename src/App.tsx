import { useState } from "react"
import type Task from "./model/Tasks.model"
import Tasks from './components/tasks/Tasks'
import './App.css'

function App() {
  const [task,setTask] = useState<Task>({name: "",
    details:"",finished:false,remove:false,enteredDate:new Date(),
    notificationDate: new Date(), deadline: new Date()
})

  return (
    <>
     <Tasks task={task} />
    </>
  )
}

export default App
