import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  FaBook,
  FaCalendarAlt,
  FaChartBar,
  FaClipboardCheck,
  FaGraduationCap,
  FaSignOutAlt,
  FaUserGraduate
} from "react-icons/fa"

import { useAuth } from "../../context/useAuth"

const adminLinks = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: FaChartBar
  },
  {
    to: "/students",
    label: "Students",
    icon: FaUserGraduate
  },
  {
    to: "/courses",
    label: "Courses",
    icon: FaBook
  },
  {
    to: "/enrollments",
    label: "Enrollments",
    icon: FaGraduationCap
  },
  {
    to: "/attendance",
    label: "Attendance",
    icon: FaClipboardCheck
  },
  {
    to: "/timetable",
    label: "Timetable",
    icon: FaCalendarAlt
  }
]

const studentLinks = [
  {
    to: "/student",
    label: "Dashboard",
    icon: FaChartBar
  },
  {
    to: "/student/courses",
    label: "My Courses",
    icon: FaBook
  },
  {
    to: "/student/attendance",
    label: "My Attendance",
    icon: FaClipboardCheck
  },
  {
    to: "/student/timetable",
    label: "My Timetable",
    icon: FaCalendarAlt
  }
]

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const links =
    user?.role === "student"
      ? studentLinks
      : adminLinks

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <aside
      className="
        w-64
        min-h-screen
        bg-linear-to-b
        from-slate-900
        via-slate-800
        to-slate-900
        text-white
        flex
        flex-col
        shadow-xl
      "
    >
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold tracking-tight">
          LearnSphere
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {user?.role === "student"
            ? "Student Portal"
            : "Admin Panel"}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive =
            location.pathname === to ||
            (to !== "/admin" &&
              to !== "/student" &&
              location.pathname.startsWith(to))

          return (
            <Link
              key={to}
              to={to}
              className={`
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                transition
                ${isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <Icon className="text-lg shrink-0" />
              <span className="font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="
            flex
            items-center
            gap-3
            w-full
            px-4
            py-3
            rounded-xl
            text-slate-300
            hover:bg-red-500/20
            hover:text-red-300
            transition
          "
        >
          <FaSignOutAlt />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
