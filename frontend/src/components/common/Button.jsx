function Button({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4
        py-2
        rounded-lg
        text-white
        font-medium
        transition
        hover:opacity-90
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export default Button
