import api from "../api/axios"

function getFilenameFromDisposition(headerValue) {
  if (!headerValue) {
    return null
  }

  const match = headerValue.match(
    /filename="?([^"]+)"?/
  )

  return match?.[1] ?? null
}

export async function downloadFromApi(
  url,
  fallbackFilename
) {
  const response = await api.get(url, {
    responseType: "blob"
  })

  const filename =
    getFilenameFromDisposition(
      response.headers["content-disposition"]
    ) || fallbackFilename

  const blob = new Blob([response.data], {
    type: response.headers["content-type"]
  })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = objectUrl
  link.download = filename
  link.click()

  URL.revokeObjectURL(objectUrl)
}
