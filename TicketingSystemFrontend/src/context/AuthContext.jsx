import { createContext, useContext, useState } from 'react'
import { usePreferences } from './PreferencesContext'
import api from '../api/axios'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const { updatePreferences, resetPreferences } = usePreferences()

  // Read token from localStorage or sessionStorage
  const getStoredUser = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const username = localStorage.getItem('username') || sessionStorage.getItem('username')
    const email = localStorage.getItem('email') || sessionStorage.getItem('email')
    const role = localStorage.getItem('role') || sessionStorage.getItem('role')
    return token ? { token, username, email, role } : null
  }

  const [user, setUser] = useState(getStoredUser)

  const login = async (data, rememberMe = false) => {
    // data already contains token, username, email, role
    // Storage is set in Login component; we just update state.
    setUser(data)

    // Load and apply this user's saved preferences from the backend
    try {
      const res = await api.get('/api/profile', {
        headers: { Authorization: `Bearer ${data.token}` }
      })
      const { theme, language } = res.data
      if (theme || language) {
        updatePreferences(theme, language)
      }
    } catch {
      // If profile fetch fails, just keep defaults — no crash
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('email')
    localStorage.removeItem('role')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('email')
    sessionStorage.removeItem('role')
    setUser(null)
    resetPreferences()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}