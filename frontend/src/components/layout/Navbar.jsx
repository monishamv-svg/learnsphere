import { useAuth } from "../../context/useAuth"

function Navbar() {
  const { user } = useAuth()

  return (
    <header
      className="
        bg-white
        border-b
        border-gray-200
        px-6
        py-4
        flex
        items-center
        justify-between
        shadow-sm
      "
    >
      <div>
        <p className="text-sm text-gray-500">
          Welcome back
        </p>
        <h3 className="text-lg font-semibold text-gray-900">
          {user?.email}
        </h3>
      </div>

      <span
        className="
          px-3
          py-1
          rounded-full
          text-xs
          font-semibold
          uppercase
          tracking-wide
          bg-blue-50
          text-blue-700
          border
          border-blue-100
        "
      >
        {user?.role}
      </span>
    </header>
  )
}

export default Navbar
