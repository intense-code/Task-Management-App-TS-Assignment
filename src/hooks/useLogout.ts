import { useCallback, useState } from "react"
import { getApiBaseUrl } from "../lib/api"

type LogoutState = {
  loading: boolean
  error: string | null
}

export const useLogout = (onLoggedOut?: () => void) => {
  const [state, setState] = useState<LogoutState>({
    loading: false,
    error: null,
  })
  const api = getApiBaseUrl()

  const logout = useCallback(async () => {
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
  }, [api, onLoggedOut])

  return { logout, ...state }
}
