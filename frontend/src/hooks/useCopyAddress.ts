import { useTranslation } from 'react-i18next'
import { LOCATION_ADDRESS, LOCATION_MAPS_URL } from '@/common/constants'
import { useToast } from '@/hooks/useToast'

/** Copies the venue address, falling back to Maps where the clipboard is blocked. */
export function useCopyAddress() {
	const { t } = useTranslation()
	const toast = useToast()

	return async () => {
		try {
			await navigator.clipboard.writeText(LOCATION_ADDRESS)
			toast.success(t('nav.address_copied'))
		} catch {
			window.open(LOCATION_MAPS_URL, '_blank', 'noopener,noreferrer')
		}
	}
}
