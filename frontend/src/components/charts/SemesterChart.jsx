import { useState } from "react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

import ChartExpandModal from "./ChartExpandModal"
import { ViewFullChartButton } from "./ViewFullChartButton"

function SemesterChart({
  data = [],
  embedded = false,
  height = 200
}) {
  const [expanded, setExpanded] = useState(false)

  const chart = (chartHeight = height) => (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          label={{
            value: "Semester",
            position: "insideBottom",
            offset: -5,
            style: {
              fill: "#6b7280",
              fontSize: 16,
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
            offset: -7,
            style: {
              fill: "#6b7280",
              fontSize: 16,
              textAnchor: "middle"
            }
          }}
        />
        <Tooltip />
        <Bar
          dataKey="count"
          fill="#10b981"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )

  if (embedded) {
    return chart(420)
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Students by Semester
            </h3>
          </div>

          <ViewFullChartButton
            onClick={() => setExpanded(true)}
          />
        </div>

        {chart()}
      </div>

      <ChartExpandModal
        isOpen={expanded}
        onClose={() => setExpanded(false)}
        title="Students by Semester"
      >
        {chart(420)}
      </ChartExpandModal>
    </>
  )
}

export default SemesterChart
