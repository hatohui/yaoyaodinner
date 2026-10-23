import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { ErrorFallback } from '@/components/common/ErrorFallback'

export default function RouteErrorPage() {
	const error = useRouteError()

	useEffect(() => console.error(error), [error])

	// A full reload also recovers from stale lazy chunks after a deploy.
	return <ErrorFallback onRetry={() => window.location.reload()} />
}
