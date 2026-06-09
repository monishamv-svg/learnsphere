import { Component } from "react"

class ErrorBoundary extends Component {

  state = {
    hasError: false
  }

  static getDerivedStateFromError() {
    return {
      hasError: true
    }
  }

  render() {

    if (this.state.hasError) {
      return (
        <div className="p-10 text-center">
          Something went wrong.
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
