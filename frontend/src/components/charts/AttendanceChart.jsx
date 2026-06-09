import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts"

const COLORS = ["#22c55e", "#ef4444", "#f59e0b"]

function AttendanceChart({
  data = [],
  className = ""
}) {
  return (
    <div
      className={`
        bg-white
        rounded-xl
        shadow-md
        p-5
        border
        border-gray-100
        h-full
        flex
        flex-col
        ${className}
      `}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Attendance Overview
      </h3>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="70%"
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AttendanceChart
