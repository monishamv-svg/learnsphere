import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../../context/useAuth"
import Button from "../../components/common/Button"
import Input from "../../components/common/Input"

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
      bg-linear-to-br
      from-slate-900
      via-blue-900
      to-slate-800
      p-4
    ">

      <form
        onSubmit={handleSubmit}
        className="
          bg-white
          p-8
          rounded-2xl
          shadow-2xl
          w-full
          max-w-md
          border
          border-gray-100
        "
      >

        <div className="text-center mb-8">
          <h1 className="
            text-3xl
            font-bold
            text-blue-600
          ">
            LearnSphere
          </h1>
          <p className="text-gray-500 mt-2">
            Sign in to your account
          </p>
        </div>

        {error && (
          <p className="
            text-red-600
            bg-red-50
            border
            border-red-100
            rounded-lg
            p-3
            mb-4
            text-sm
          ">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />
        </div>

        <Button
          type="submit"
          className="
            w-full
            mt-6
            bg-blue-600
            py-3
          "
        >
          Login
        </Button>

      </form>
    </div>
  )
}

export default LoginPage
