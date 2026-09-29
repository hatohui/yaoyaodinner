import { useSyncExternalStore } from 'react'

const QUERY = '(hover: hover) and (pointer: fine)'

const subscribe = (onChange: () => void) => {
	const media = window.matchMedia(QUERY)
	media.addEventListener('change', onChange)
	return () => media.removeEventListener('change', onChange)
}

/** False on touch screens, where hover-only UI never shows. */
export function useCanHover() {
	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(QUERY).matches,
		() => true
	)
}
