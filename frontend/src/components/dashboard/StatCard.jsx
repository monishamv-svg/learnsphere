const accentStyles = {
  blue: "border-l-blue-500",
  violet: "border-l-violet-500",
  indigo: "border-l-indigo-500",
  green: "border-l-green-500",
  amber: "border-l-amber-500"
}

function StatCard({
  title,
  value,
  accent = "blue"
}) {
  return (
    <div
      className={`
        bg-white
        rounded-xl
        shadow-md
        p-6
        border
        border-gray-100
        border-l-4
        ${accentStyles[accent]}
      `}
    >
      <h3
        className="
          text-gray-500
          text-sm
          font-medium
        "
      >
        {title}
      </h3>

      <p
        className="
          text-3xl
          font-bold
          mt-2
          text-gray-900
        "
      >
        {value}
      </p>
    </div>
  )
}

export default StatCard
