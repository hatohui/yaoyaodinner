import { useConfig } from '@/hooks/useConfig'
import { useIsAdmin } from '@/hooks/useIsAdmin'

/** Guests wait for the host to open ordering; admins can always enter orders. */
export function useOrderingOpen() {
	const { ordersOpen } = useConfig()
	const { isAdmin } = useIsAdmin()
	return ordersOpen || isAdmin
}
