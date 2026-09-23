import {
	QueryCache,
	MutationCache,
	type QueryClientConfig,
} from '@tanstack/react-query'
import { toast } from 'sonner'

const useTanstackConfig = (
	translation: ReturnType<typeof import('react-i18next').useTranslation>
): QueryClientConfig => {
	const { t } = translation

	const handleError = (error: Error) => {
		const errorMessage =
			typeof error.message === 'string' && error.message
				? error.message
				: 'UNKNOWN_ERROR'
		const translatedMessage = t(`errors.${errorMessage}`, {
			defaultValue: errorMessage.toLowerCase().replace(/_/g, ' '),
		})
		toast.error(t('errors.title'), {
			description: translatedMessage,
		})
	}

	return {
		queryCache: new QueryCache({ onError: handleError }),
		mutationCache: new MutationCache({ onError: handleError }),
		defaultOptions: {
			queries: {
				retry: 1,
				staleTime: 30_000,
			},
		},
	}
}

export default useTanstackConfig
