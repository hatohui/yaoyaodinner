import { useCallback, useSyncExternalStore } from 'react'

export const DESKTOP_QUERY = '(min-width: 1024px)'

export function useMediaQuery(query: string, fallback = true) {
	const subscribe = useCallback(
		(onChange: () => void) => {
			const media = window.matchMedia(query)
			media.addEventListener('change', onChange)
			return () => media.removeEventListener('change', onChange)
		},
		[query]
	)
	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(query).matches,
		() => fallback
	)
}
