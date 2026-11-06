import {
	QueryCache,
	MutationCache,
	type QueryClientConfig,
} from '@tanstack/react-query'
import i18n from 'i18next'
import { toast } from 'sonner'

const handleError = (error: Error) => {
	const errorMessage =
		typeof error.message === 'string' && error.message
			? error.message
			: 'UNKNOWN_ERROR'
	const translatedMessage = i18n.t(`errors.${errorMessage}`, {
		defaultValue: errorMessage.toLowerCase().replace(/_/g, ' '),
	})
	// many queries failing for the same reason should show one toast, not a stack
	toast.error(i18n.t('errors.title'), {
		id: errorMessage,
		description: translatedMessage,
	})
}

const tanstackConfig: QueryClientConfig = {
	queryCache: new QueryCache({
		onError: (error, query) => {
			if (!query.meta?.silent) handleError(error)
		},
	}),
	mutationCache: new MutationCache({
		onError: (error, _variables, _context, mutation) => {
			if (!mutation.meta?.ownErrorToast) handleError(error)
		},
	}),
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 30_000,
		},
	},
}

export default tanstackConfig
