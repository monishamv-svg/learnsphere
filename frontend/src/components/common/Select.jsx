function Select({
  className = "",
  children,
  ...props
}) {
  return (
    <select
      className={`
        border
        border-gray-300
        p-2.5
        rounded-lg
        w-full
        bg-white
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:border-transparent
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  )
}

export default Select
