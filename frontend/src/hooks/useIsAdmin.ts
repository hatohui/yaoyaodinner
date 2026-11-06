import { useEffect } from 'react'
import { useGetActiveEvent } from '@/api/events/events'
import type { EventSummaryDto } from '@/api/model'
import { useAdmin } from '@/hooks/useAdmin'

export function useIsAdmin() {
	const passphrase = useAdmin(s => s.passphrase)
	const clear = useAdmin(s => s.clear)

	const { isSuccess, isError, isLoading } =
		useGetActiveEvent<EventSummaryDto | null>({
			// a stale passphrase is just cleared below; no need to alarm anyone
			query: {
				enabled: Boolean(passphrase),
				retry: false,
				meta: { silent: true },
			},
		})

	useEffect(() => {
		if (passphrase && isError) clear()
	}, [passphrase, isError, clear])

	return {
		isAdmin: Boolean(passphrase) && isSuccess,
		isVerifying: Boolean(passphrase) && isLoading,
	}
}
