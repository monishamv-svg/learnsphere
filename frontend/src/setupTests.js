import "@testing-library/jest-dom"
import { TextDecoder, TextEncoder } from "util"

process.env.VITE_API_BASE_URL = "http://localhost:8000"

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

beforeEach(() => {
  localStorage.clear()
})
