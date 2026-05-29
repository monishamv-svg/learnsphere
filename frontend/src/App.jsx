import { useEffect } from "react"
import api from "./api/axios"

function App() {

  useEffect(() => {
    api.get("/")
      .then((response) => {
        console.log(response.data)
      })
      .catch((error) => {
        console.error(error)
      })
  }, [])

  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold text-blue-600">
        LearnSphere Frontend
      </h1>
    </div>
  )
}

export default App
