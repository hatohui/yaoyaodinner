import { useEffect, useRef, useState } from 'react'
import { useRouteError } from 'react-router'
import { ErrorFallback } from '@/components/common/ErrorFallback'
import { GlobalLoading } from '@/components/common/GlobalLoading'
import { isChunkLoadError, reloadForNewDeploy } from '@/utils/chunkReload'

/**
 * Route error screen. A missing chunk means a deploy replaced the build this tab
 * was running, so it reloads once (the URL is already the one being opened).
 */
export function RouteError() {
	const error = useRouteError()
	const staleChunk = isChunkLoadError(error)
	const attempted = useRef(false)
	const [reloadFailed, setReloadFailed] = useState(false)

	useEffect(() => {
		if (!staleChunk) {
			console.error(error)
			return
		}
		if (attempted.current) return
		attempted.current = true
		if (!reloadForNewDeploy()) setReloadFailed(true)
	}, [error, staleChunk])

	if (staleChunk && !reloadFailed) return <GlobalLoading />
	return <ErrorFallback onRetry={() => window.location.reload()} />
}
