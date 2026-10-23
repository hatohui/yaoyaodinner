import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorFallback } from './ErrorFallback'

interface AppErrorBoundaryProps {
	children: ReactNode
}

interface AppErrorBoundaryState {
	hasError: boolean
}

/**
 * Catches crashes outside the router (providers, the router itself). Page
 * crashes are handled by `pages/error.tsx` so the navbar stays usable.
 */
export class AppErrorBoundary extends Component<
	AppErrorBoundaryProps,
	AppErrorBoundaryState
> {
	state: AppErrorBoundaryState = { hasError: false }

	static getDerivedStateFromError(): AppErrorBoundaryState {
		return { hasError: true }
	}

	componentDidCatch(error: unknown, info: ErrorInfo) {
		console.error(error, info.componentStack)
	}

	render() {
		if (!this.state.hasError) return this.props.children

		return (
			<div className='min-h-screen bg-background'>
				<ErrorFallback onRetry={() => window.location.reload()} />
			</div>
		)
	}
}
