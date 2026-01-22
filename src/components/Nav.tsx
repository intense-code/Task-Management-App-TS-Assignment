
import { useState } from "react"
import styles from "./Nav.module.css"

type NavProps = {
  skin: "classic" | "sunset" | "mint"
  setSkin: (skin: "classic" | "sunset" | "mint") => void
}

const AppNav: React.FC<NavProps> = ({ skin, setSkin }) => {
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
        <label className={styles.skinLabel}>
          Skin
          <select
            className={styles.skinSelect}
            value={skin}
            onChange={(e) => setSkin(e.target.value as NavProps["skin"])}
          >
            <option value="classic">Classic</option>
            <option value="sunset">Sunset</option>
            <option value="mint">Mint</option>
          </select>
        </label>
      </div>
    </nav>
  )
}

export default AppNav
