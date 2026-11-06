import type { LucideIcon } from 'lucide-react'
import { Armchair, Copy, Map, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LOCATION_ADDRESS, LOCATION_MAPS_URL } from '@/common/constants'
import { useCanHover } from '@/hooks/useCanHover'
import { useConfig } from '@/hooks/useConfig'
import { useGuest } from '@/hooks/useGuest'
import { useToast } from '@/hooks/useToast'

export type QuickAction = { key: string; label: string; icon: LucideIcon } & (
	| { to: string }
	| { href: string }
	| { onSelect: () => void }
)

/** Guest shortcuts; empty until a PIN the server accepted is stored. */
export function useQuickActions(): QuickAction[] {
	const { t } = useTranslation()
	const toast = useToast()
	const { floorPlan, tables } = useConfig()
	const pin = useGuest(s => s.pin)
	const myTableId = useGuest(s => s.me?.tableId)
	// a mouse means desktop, where pasting the address beats opening Maps
	const canHover = useCanHover()

	if (!pin) return []

	const copyAddress = async () => {
		try {
			await navigator.clipboard.writeText(LOCATION_ADDRESS)
			toast.success(t('nav.address_copied'))
		} catch {
			window.open(LOCATION_MAPS_URL, '_blank', 'noopener,noreferrer')
		}
	}

	const actions: QuickAction[] = []
	if (tables && myTableId)
		actions.push({
			key: 'my-table',
			label: t('identity.my_table'),
			icon: Armchair,
			to: `/tables/${myTableId}`,
		})
	if (tables && floorPlan)
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
