import { useEffect, useState } from "react"; // React state and lifecycle hooks.
import { useNavigate } from "react-router-dom";
import { useLogout } from "./hooks/useLogout";
import GoogleLoginButton from "./components/auth/GoogleLoginButton"; // Google sign-in widget.
import ProfileEditor from "./components/auth/ProfileEditor"; // Editable profile form.
import type { User } from "./model/auth"; // User shape shared with the API.
import Nav from "./components/nav/Nav";
import { useSkin } from "./hooks/useSkin";
import "./LandingPage.model.css";

type MeResponse = { user: User } | { error: string }; // /me API response union.

export default function LandingPage() { // Main app component.
  const [user, setUser] = useState<User | null>(null); // Current session user.
  const [loggingIn, setLoggingIn] = useState(false);
  const api = import.meta.env.VITE_API_URL; // API base URL from env.
  const navigate = useNavigate();
  const { logout, loading: logoutLoading } = useLogout(() => setUser(null));
  const { skin, setSkin } = useSkin();

  async function loadMe() { // Fetch the current session user.
    const res = await fetch(`${api}/me`, { credentials: "include" }); // Send cookie.
    if (!res.ok) { // Unauthenticated or invalid session.
      setUser(null); // Clear user state.
      return; // Stop on failure.
    }
    const data = (await res.json()) as MeResponse; // Parse response body.
    if ("user" in data) setUser(data.user); // Store user data.
    else setUser(null); // Clear on error payload.
  } // End loadMe.

  useEffect(() => { // Run once on mount.
    loadMe(); // Load session user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps means only on first render.

  return ( // Render UI.
    <div className="landing-shell">{/* App wrapper */}
      {loggingIn ? null : !user ? ( // Show login if no user.
        <> {/* Fragment wrapper */}
          <div className="landing-nav">
            <Nav skin={skin} setSkin={setSkin} />
          </div>
          <div>
            <img src='../electron/16.jpeg'id="landing-logo" />
          </div>
          <h1>Task Accomplisher</h1> {/* Prompt text */}
          <GoogleLoginButton
            onLogin={(u) => {
              setLoggingIn(true);
              setTimeout(() => navigate("/taskapp"), 600);
              setUser(u);
            }}
          /> {/* Google login */}
        </>
      ) : (
        <div className="profile-card"> {/* Profile card */}
          <div className="profile-row">{/* Avatar row */}
            {user.picture ? ( // Show avatar if present.
              <img
                src={user.picture}
                alt="avatar"
                width={64}
                height={64}
                className="profile-avatar"
              /> 
            ) : (
              <div
                className="profile-avatar profile-avatar--placeholder"
              />  
            )} {/* End avatar conditional */}

            <div>{/* User text details */}
              <div className="profile-name">{/* Name */}
                {user.name ?? "No name set"} {/* Name value */}
              </div> {/* End name */}
              <div className="profile-meta">{user.email}</div>  
              {user.username ? (
                <div className="profile-meta">@{user.username}</div>
              ) : null}
            </div>
          </div> 

          <div className="profile-actions">{/* Action buttons */}
            <button onClick={logout} className="profile-action-button" disabled={logoutLoading}>{/* Logout */}
              {logoutLoading ? "Logging out..." : "Logout"} {/* Button label */}
            </button> {/* End logout button */}
            <button onClick={loadMe} className="profile-action-button">{/* Refresh */}
              Refresh profile {/* Button label */}
            </button> {/* End refresh button */}
            <a href="/taskapp" >
            <button onClick={loadMe} className="profile-action-button">{/* Refresh */}
              Tasks {/* Button label */}
            </button> {/* End refresh button */}
            </a>
              {/* End refresh button */}
          </div> {/* End action buttons */}

          <ProfileEditor
            user={user}
            onSave={(u) => {
              setUser(u);
            }}
          /> {/* Profile editor form */}
        </div>
      )}
      {loggingIn ? (
        <div className="login-overlay" role="status" aria-live="polite">
          <div className="login-status">
            Logging you in
            <span className="login-dots" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  ); // End render.
} // End App component.
