import { useTranslation } from 'react-i18next'
import { type Query, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDeleteFeedback as useDeleteFeedbackMutation } from '@/api/feedback/feedback'
import type { GetFeedbackResponseDto } from '@/api/model'

const isFeedbackList = (query: Query) =>
	String(query.queryKey[0]).startsWith('/api/feedback')

/** Deletes a feedback post from every cached wall/admin list, restoring them on failure. */
export function useDeleteFeedback() {
	const { t } = useTranslation()
	const qc = useQueryClient()

	const { mutate, isPending } = useDeleteFeedbackMutation({
		mutation: {
			meta: { ownErrorToast: true },
			onMutate: async ({ id }) => {
				await qc.cancelQueries({ predicate: isFeedbackList })
				const previous = qc.getQueriesData<GetFeedbackResponseDto>({
					predicate: isFeedbackList,
				})
				qc.setQueriesData<GetFeedbackResponseDto>(
					{ predicate: isFeedbackList },
					old =>
						old?.feedback && {
							...old,
							feedback: old.feedback.filter(item => item.id !== id),
							total: Math.max(0, old.total - 1),
						}
				)
				return { previous }
			},
			onError: (_error, _variables, context) => {
				context?.previous.forEach(([key, data]) => qc.setQueryData(key, data))
				toast.error(t('feedback.delete_failed'))
			},
			onSuccess: () => toast.success(t('feedback.deleted')),
			onSettled: () => qc.invalidateQueries({ predicate: isFeedbackList }),
		},
	})

	return {
		deleteFeedback: (id: string) => mutate({ id }),
		isDeleting: isPending,
	}
}
