import { useGuest } from '@/hooks/useGuest'

/** Your person id at this table, if the identity you picked sits here. */
export function useWhoAmI(tableId: string) {
	const me = useGuest(s => s.me)
	const personId = me && me.tableId === tableId ? me.id : null
	return { personId }
}
