import { useCallback, useState } from "react"

type LogoutState = {
  loading: boolean
  error: string | null
}

export const useLogout = (onLoggedOut?: () => void) => {
  const [state, setState] = useState<LogoutState>({
    loading: false,
    error: null,
  })

  const logout = useCallback(async () => {
    const api = import.meta.env.VITE_API_URL
    setState({ loading: true, error: null })
    try {
      await fetch(`${api}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
      onLoggedOut?.()
    } catch {
      setState({ loading: false, error: "Logout failed" })
      return
    }
    setState({ loading: false, error: null })
  }, [onLoggedOut])

  return { logout, ...state }
}
