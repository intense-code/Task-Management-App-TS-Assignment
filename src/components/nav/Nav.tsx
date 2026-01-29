
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./Nav.module.css"
import { useLogout } from "../../hooks/useLogout"

type NavProps = {
  skin: "classic" | "sunset" | "mint"
  setSkin: (skin: "classic" | "sunset" | "mint") => void
}

const AppNav: React.FC<NavProps> = ({ skin, setSkin }) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { logout, loading: logoutLoading } = useLogout(() => navigate("/"))

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
        <a className={styles.link} href="/taskapp">
          Tasks
        </a>
        <a className={styles.link} href="#calendar">
          Calendar
        </a>
        <a className={styles.link} href="#settings">
          Settings
        </a>
        <a className={styles.link} href="/">
          Profile
        </a>
        <button type="button" className={styles.logout} onClick={logout} disabled={logoutLoading}>
          {logoutLoading ? "Logging out..." : "Logout"}
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
