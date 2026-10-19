import { Component } from 'react'
import { CircleAlert, RotateCw } from 'lucide-react'

/**
 * Stops one broken section from blanking the whole page: shows a small "couldn't load" box
 * with a retry button instead. Wrap each dashboard section in it.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(`[${this.props.name ?? 'section'}]`, error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="flex items-center gap-2 text-sm">
          <CircleAlert className="size-5 shrink-0 text-[#b4442a]" aria-hidden="true" />
          {this.props.name ? `${this.props.name} couldn't load.` : "This part couldn't load."} Refresh the page. If it
          keeps happening, restart the backend.
        </p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="btn-outline min-h-10 px-4 text-sm"
        >
          <RotateCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    )
  }
}
