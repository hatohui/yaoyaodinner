import { useSyncExternalStore } from 'react'

/** Live match for a CSS media query, for layouts that render different trees. */
export function useMediaQuery(query: string) {
	return useSyncExternalStore(
		onChange => {
			const media = window.matchMedia(query)
			media.addEventListener('change', onChange)
			return () => media.removeEventListener('change', onChange)
		},
		() => window.matchMedia(query).matches,
		() => false
	)
}
