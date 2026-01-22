
import { useState } from "react"
import styles from "./Nav.module.css"

const AppNav: React.FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <nav className={styles.nav}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="primary-navigation"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.srOnly}>Toggle navigation</span>
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </button>
      <div
        id="primary-navigation"
        className={`${styles.menu} ${open ? styles.menuOpen : ""}`}
      >
        <a className={styles.link} href="#tasks">
          Tasks
        </a>
        <a className={styles.link} href="#calendar">
          Calendar
        </a>
        <a className={styles.link} href="#settings">
          Settings
        </a>
        <button type="button" className={styles.logout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default AppNav
