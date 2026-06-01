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
      return <p>Loading...</p>
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