function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg"
}) {
  if (!isOpen) return null

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        overflow-y-auto
        bg-black/50
        p-4
      "
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          className={`
            bg-white
            p-6
            rounded-2xl
            w-full
            shadow-xl
            max-h-[calc(100vh-2rem)]
            overflow-y-auto
            ${maxWidth}
          `}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {title && (
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {title}
            </h2>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
