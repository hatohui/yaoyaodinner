import { useTranslation } from 'react-i18next'
import { useOrderingStage } from '@/hooks/useOrderingStage'

export function useStageTitle() {
	const { t } = useTranslation()
	const { stage } = useOrderingStage()

	return {
		closed: t('ordering.closed_title'),
		open: t('ordering.open_title'),
		confirmed: t('ordering.confirmed_title'),
		dinner: t('ordering.dinner_title'),
		finalized: t('ordering.finalized_title'),
	}[stage]
}
