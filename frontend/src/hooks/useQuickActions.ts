import type { LucideIcon } from 'lucide-react'
import { Armchair, Copy, Map, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LOCATION_MAPS_URL } from '@/common/constants'
import { useCanHover } from '@/hooks/useCanHover'
import { useConfig } from '@/hooks/useConfig'
import { useGuest } from '@/hooks/useGuest'
import { useCopyAddress } from '@/hooks/useCopyAddress'

export type QuickAction = { key: string; label: string; icon: LucideIcon } & (
	| { to: string }
	| { href: string }
	| { onSelect: () => void }
)

/** Guest shortcuts; empty for visitors without event access. */
export function useQuickActions(): QuickAction[] {
	const { t } = useTranslation()
	const copyAddress = useCopyAddress()
	const { floorPlan, tables, isLoading } = useConfig()
	const pin = useGuest(s => s.pin)
	const myTableId = useGuest(s => s.me?.tableId)
	// a mouse means desktop, where pasting the address beats opening Maps
	const canHover = useCanHover()

	// a claimed name already required access (a valid PIN, or admin)
	if (!pin && !myTableId) return []

	const actions: QuickAction[] = []
	if (!isLoading && tables && myTableId)
		actions.push({
			key: 'my-table',
			label: t('identity.my_table'),
			icon: Armchair,
			to: `/tables/${myTableId}`,
		})
	if (!isLoading && tables && floorPlan)
		actions.push({
			key: 'map',
			label: t('floor_plan.view_map'),
			icon: Map,
			to: '/tables/map',
		})
	actions.push(
		canHover
			? {
					key: 'location',
					label: t('nav.copy_address'),
					icon: Copy,
					onSelect: copyAddress,
				}
			: {
					key: 'location',
					label: t('nav.location'),
					icon: MapPin,
					href: LOCATION_MAPS_URL,
				}
	)
	return actions
}
