import { useEffect, useRef, useState } from "react"; // React hooks for lifecycle and refs.
import type {User} from "../../model/auth" // User shape returned by the API.

type Props = {
  onLogin?: (user: User) => void; // Optional callback when login succeeds.
};

type AuthGoogleResponse = {
  user: User; // Payload returned by /auth/google.
};

export default function GoogleLoginButton({ onLogin }: Props) { // Google sign-in button.
  const btnRef = useRef<HTMLDivElement | null>(null); // DOM container for GSI button.
  const [loading, setLoading] = useState(true);

  useEffect(() => { // Initialize Google Identity Services once.
    let canceled = false;
    let initialized = false;

    const tryInit = () => {
      if (initialized || canceled) return;
      const google = window.google; // Global injected by Google Identity Services.
      if (!google || !btnRef.current) return; // Bail if script not loaded yet.

      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, // OAuth client id.
        callback: async (response) => { // Handle credential response.
          console.log("Google credential received", response?.credential?.slice(0, 20)); // Debug.
          console.log("Posting token to API", import.meta.env.VITE_API_URL); // Debug.

          const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
            method: "POST", // Use POST for auth.
            headers: { "Content-Type": "application/json" }, // JSON body.
            credentials: "include", // Allow session cookie to be set.
            body: JSON.stringify({ idToken: response.credential }), // Send ID token.
          });

          if (!res.ok) { // Handle auth error.
            console.error("Login failed"); // Surface auth errors.
            return; // Stop on failure.
          }

          const data = (await res.json()) as AuthGoogleResponse; // Parse response.
          onLogin?.(data.user); // Notify parent with logged-in user.
        }, // End callback.
      }); // End initialize.

      google.accounts.id.renderButton(btnRef.current, {
        theme: "outline", // Button theme.
        size: "large", // Button size.
        text: "continue_with", // Button label style.
        shape: "pill", // Button shape.
      }); // Render into container.

      initialized = true;
      setLoading(false);
    };

    setLoading(true);
    const interval = window.setInterval(tryInit, 100);
    tryInit();

    return () => {
      canceled = true;
      window.clearInterval(interval);
    };
  }, [onLogin]); // Re-run if callback changes.

  return (
    <div className="gsi-wrap">
      {loading ? <div className="gsi-loading">Loading Google sign-in…</div> : null}
      <div ref={btnRef} />
    </div>
  ); // Google renders the button inside this div.
} // End GoogleLoginButton.
