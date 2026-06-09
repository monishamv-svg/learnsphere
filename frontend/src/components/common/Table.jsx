function Table({
  columns,
  children,
  className = ""
}) {
  return (
    <div
      className="
        w-full
        bg-white
        shadow-md
        rounded-xl
        overflow-hidden
        border
        border-gray-100
      "
    >
      <table
        className={`w-full ${className}`}
      >
        <thead>
          <tr className="bg-slate-50">
            {columns.map((column) => (
              <th
                key={column}
                className="
                  p-3
                  text-left
                  text-sm
                  font-semibold
                  text-gray-700
                "
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export default Table
