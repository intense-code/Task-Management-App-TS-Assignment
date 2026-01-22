export default interface Task {
    name: string;
    details: string;
    finished: boolean;
    remove: boolean;
    enteredDate: Date;
    notificationDate: Date;
    deadline: Date;
    notify_pressed: boolean;
    deadline_pressed: boolean;
    reschedule_after_completed: boolean;
}
