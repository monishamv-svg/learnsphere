import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import "react-toastify/dist/ReactToastify.css"
import { ToastContainer } from "react-toastify"
import ErrorBoundary from "./components/common/ErrorBoundary"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
      />
    </ErrorBoundary>
  </StrictMode>
)
