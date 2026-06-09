import { useEffect, useState } from "react"

import api from "../api/axios"
import { AuthContext } from "./auth-context"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const [loading, setLoading] = useState(
    () => !!localStorage.getItem("token")
  )

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      return
    }

    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`

    api.get("/auth/me", { timeout: 10000 })
      .then((response) => {
        setUser(response.data)
      })
      .catch(() => {
        localStorage.removeItem("token")
        delete api.defaults.headers.common[
          "Authorization"
        ]
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = async (email, password) => {
    const formData = new URLSearchParams()

    formData.append("username", email)
    formData.append("password", password)

    const response = await api.post(
      "/auth/token",
      formData,
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        }
      }
    )

    const token = response.data.access_token

    localStorage.setItem("token", token)

    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`

    const userResponse = await api.get("/auth/me")

    setUser(userResponse.data)

    return userResponse.data
  }

  const logout = () => {
    localStorage.removeItem("token")

    delete api.defaults.headers.common[
      "Authorization"
    ]

    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
