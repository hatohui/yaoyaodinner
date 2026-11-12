import { useEffect } from 'react'
import { verifyPin } from '@/api/auth/auth'
import { useGuest } from '@/hooks/useGuest'

const RECHECK_MS = 3 * 60 * 1000

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
		return () => clearInterval(timer)
	}, [pin, clear])
}
