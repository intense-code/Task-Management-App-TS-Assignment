export default interface Task {
    name: string;
    details: string;
    finished: boolean;
    remove: boolean;
    enteredDate: Date;
    notificationDate: Date;
    deadline:Date
}