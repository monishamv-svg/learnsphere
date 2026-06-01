import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../../context/useAuth"

function LoginPage() {

  const navigate = useNavigate()

  const { login } = useAuth()

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [error, setError] = useState("")

  const handleSubmit = async (e) => {

    e.preventDefault()

    try {

      const user = await login(
        email,
        password
      )

      if (user.role === "admin") {
        navigate("/admin")
      } else {
        navigate("/student")
      }

    } catch {

      setError(
        "Invalid email or password"
      )
    }
  }

  return (
    <div className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-gray-100
    ">

      <form
        onSubmit={handleSubmit}
        className="
          bg-white
          p-8
          rounded-xl
          shadow-lg
          w-full
          max-w-md
        "
      >

        <h1 className="
          text-3xl
          font-bold
          mb-6
          text-center
          text-blue-600
        ">
          LearnSphere Login
        </h1>

        {error && (
          <p className="
            text-red-500
            mb-4
          ">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="
            w-full
            border
            p-3
            rounded-lg
            mb-4
          "
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="
            w-full
            border
            p-3
            rounded-lg
            mb-6
          "
        />

        <button
          type="submit"
          className="
            w-full
            bg-blue-600
            text-white
            py-3
            rounded-lg
            hover:bg-blue-700
          "
        >
          Login
        </button>

      </form>
    </div>
  )
}

export default LoginPage