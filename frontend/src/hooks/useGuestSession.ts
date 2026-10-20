import { useEffect } from 'react'
import { verifyPin } from '@/api/auth/auth'
import { useGuest } from '@/hooks/useGuest'

const RECHECK_MS = 30_000

/** Drops the stored PIN once the event it unlocked is gone or its PIN changed. */
export function useGuestSession() {
	const pin = useGuest(s => s.pin)
	const clear = useGuest(s => s.clear)

	useEffect(() => {
		if (!pin) return

		const check = () =>
			verifyPin({ pin })
				.then(res => {
					if (!res.valid) clear()
				})
				.catch(() => {})

		check()
		const timer = setInterval(check, RECHECK_MS)
		window.addEventListener('focus', check)
		return () => {
			clearInterval(timer)
			window.removeEventListener('focus', check)
		}
	}, [pin, clear])
}
