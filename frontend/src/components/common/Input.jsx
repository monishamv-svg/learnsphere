function Input({
  className = "",
  ...props
}) {
  return (
    <input
      className={`
        border
        border-gray-300
        p-2.5
        rounded-lg
        w-full
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:border-transparent
        ${className}
      `}
      {...props}
    />
  )
}

export default Input
