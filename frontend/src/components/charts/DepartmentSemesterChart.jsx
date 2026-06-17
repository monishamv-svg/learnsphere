import { useMemo } from "react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

const DEPARTMENT_KEYS = {
  "Computer Science Engineering": "CSE",
  "Information Science Engineering": "ISE",
  "Mechanical Engineering": "MEC",
  "Electrical and Electronics Engineering": "EEE",
  "Civil Engineering": "CIV",
  "Aeronautical Engineering": "AER",
}

const DEPARTMENT_COLORS = {
  CSE: "#3b82f6",
  ISE: "#6366f1",
  MEC: "#10b981",
  EEE: "#f59e0b",
  CIV: "#ef4444",
  AER: "#8b5cf6",
}

function buildChartData(rows = []) {
  const semesters = new Map()

  rows.forEach((row) => {
    const semester = row.semester
    const departmentKey =
      DEPARTMENT_KEYS[row.department] || row.department

    if (!semesters.has(semester)) {
      semesters.set(semester, {
        name: `Sem ${semester}`,
        semester,
      })
    }

    semesters.get(semester)[departmentKey] = row.count
  })

  return [...semesters.values()].sort(
    (left, right) => left.semester - right.semester
  )
}

function DepartmentSemesterTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900 mb-1">
        {label}
      </p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-gray-600"
          style={{ color: entry.color }}
        >
          {entry.dataKey}: {entry.value} student
          {entry.value === 1 ? "" : "s"}
        </p>
      ))}
    </div>
  )
}

function DepartmentSemesterChart({
  data = [],
  embedded = false
}) {
  const chartData = useMemo(
    () => buildChartData(data),
    [data]
  )

  const departmentKeys = useMemo(() => {
    const keys = new Set()

    data.forEach((row) => {
      keys.add(
        DEPARTMENT_KEYS[row.department] || row.department
      )
    })

    return [...keys]
  }, [data])

  const chart = (
    <ResponsiveContainer width="100%" height={embedded ? 460 : 200}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          label={{
            value: "Semester",
            position: "insideBottom",
            offset: -3,
            style: {
              fill: "#6b7280",
              fontSize: 12,
              textAnchor: "middle"
            }
          }}
        />
        <YAxis
          allowDecimals={false}
          width={52}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          label={{
            value: "Students",
            angle: -90,
            position: "left",
            offset: -5,
            style: {
              fill: "#6b7280",
              fontSize: 12,
              textAnchor: "middle"
            }
          }}
        />
        <Tooltip content={<DepartmentSemesterTooltip />} />
        <Legend />
        {departmentKeys.map((departmentKey) => (
          <Bar
            key={departmentKey}
            dataKey={departmentKey}
            fill={
              DEPARTMENT_COLORS[departmentKey] || "#64748b"
            }
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )

  return chart
}

export default DepartmentSemesterChart
