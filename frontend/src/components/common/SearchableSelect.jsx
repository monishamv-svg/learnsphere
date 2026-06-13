import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import Input from "./Input"
import FormField from "./FormField"

function SearchableSelect({
  label,
  id,
  placeholder = "Search...",
  options = [],
  value,
  onChange,
  required = false,
  disabled = false,
  emptyMessage = "No matches found"
}) {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  )

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return options
    }

    return options.filter((option) =>
      option.searchText.toLowerCase().includes(query)
    )
  }, [options, search])

  const inputValue = open
    ? search
    : (selectedOption?.label ?? "")

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false)

        if (selectedOption) {
          setSearch(selectedOption.label)
        }
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      )
    }
  }, [selectedOption])

  const handleSelect = (option) => {
    onChange(option.value)
    setSearch(option.label)
    setOpen(false)
  }

  return (
    <FormField label={label} htmlFor={id}>
      <div ref={containerRef} className="relative">
        <Input
          id={id}
          value={inputValue}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)

            if (!e.target.value) {
              onChange("")
            }
          }}
          onFocus={() => {
            setSearch(selectedOption?.label ?? "")
            setOpen(true)
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          required={required && !value}
        />

        {open && !disabled && (
          <ul
            className="
              absolute
              z-10
              mt-1
              max-h-48
              w-full
              overflow-y-auto
              rounded-lg
              border
              border-gray-200
              bg-white
              shadow-lg
            "
          >
            {filteredOptions.length === 0 ? (
              <li className="p-3 text-sm text-gray-500">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className="
                      w-full
                      px-3
                      py-2
                      text-left
                      text-sm
                      hover:bg-blue-50
                    "
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect(option)
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </FormField>
  )
}

export default SearchableSelect
