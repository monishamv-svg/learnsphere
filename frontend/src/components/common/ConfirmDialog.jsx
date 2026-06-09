import Button from "./Button"

function ConfirmDialog({
  isOpen,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmClassName = "bg-red-600"
}) {
  if (!isOpen) return null

  return (
    <div
      className="
        fixed
        inset-0
        bg-black/50
        flex
        items-center
        justify-center
        z-60
        p-4
      "
    >
      <div
        className="
          bg-white
          rounded-2xl
          p-6
          w-full
          max-w-md
          shadow-xl
        "
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {title}
        </h3>

        <p className="text-gray-600 mb-6">
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            className="bg-gray-500"
          >
            {cancelLabel}
          </Button>

          <Button
            onClick={onConfirm}
            className={confirmClassName}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
