# Task-Management-App-TS-Assignment
Task management app in TS with React using Authentication, ContextAPI, Reducer, Global State Management, Typed Hooks, Error Handling and Validation
# Requirments
For Linux Make sure you have these installed to get sound
which paplay
which aplay
# Features on /
    X Keep notifcation window up until user clicks on it
    X Deadline should automatically match up with the time of notification date when chosen
    X- Play a beep sound
    - Every Task apart of the past shows under the finished category tab
    - Sort tasks in chronological/Ascending name order 
    H Reschedule after it completes Button
# In Settings
    - View deadline and/or finshed and not
    - Should have several styling skins
    - Snooze setting to say how long snooze will be
    - Push back all or selected notifications X amount of time
    - WHen marked finished and theres a deadline date that has passed it automatically removes the task so there was time for reviewing the task
    - Have a trashcan for when you erase tasks you can undo the delete and bring them back 
    - PUt a clock up that shows the time based off of what local standard time zone they have in the settings
    - Default amount of time for reschedule checkbox
# Authentication
    - Make a landing page
    - Add in 0Auth google
    - Login with regular email and password with jwt session
    - Postgres Local DB
    - Forgot password page
    - Make production ready DB with supabase
# Routing (BrowserRouter)
    - Dev + preview fallback handled by Vite (SPA mode)
    - Production host must rewrite all routes to /index.html to avoid 404 on refresh
# Testing
    - Verify the window came up and the contents match task.json
    - Test the styles are the correct properties
    - Make sure all links say the right values and have the correct routing

Unit: npm test
UI: npm run test:ui
E2E: npm run test:e2e
E2E UI: npm run test:e2e:ui
