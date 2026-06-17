import { FiX } from "react-icons/fi"

function ChartExpandModal({
  isOpen,
  onClose,
  title,
  children
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-60
        bg-black/50
        p-4
        flex
        items-center
        justify-center
      "
      onClick={onClose}
    >
      <div
        className="
          bg-white
          rounded-2xl
          shadow-xl
          w-full
          max-w-5xl
          max-h-[calc(100vh-2rem)]
          overflow-y-auto
          p-6
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="
              p-2
              rounded-lg
              text-gray-500
              hover:bg-gray-100
            "
            aria-label="Close chart"
          >
            <FiX size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

export default ChartExpandModal
