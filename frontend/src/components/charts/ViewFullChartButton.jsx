export function ViewFullChartButton({
  onClick,
  label = "View full chart"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        text-sm
        font-medium
        text-blue-600
        hover:text-blue-800
        hover:underline
      "
    >
      {label}
    </button>
  )
}
