import {
    Navigate
  } from "react-router-dom"
  
  import {
    useAuth
  } from "../context/useAuth"
  
  function ProtectedRoute({
    children,
    role
  }) {
  
    const {
      user,
      loading
    } = useAuth()
  
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Loading...</p>
        </div>
      )
    }
  
    if (!user) {
      return <Navigate to="/" />
    }
  
    if (
      role &&
      user.role !== role
    ) {
      return <Navigate to="/" />
    }
  
    return children
  }
  
  export default ProtectedRoute