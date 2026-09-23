import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	useGetFeedback,
	useCreateFeedback,
	useReactToFeedback,
	getGetFeedbackQueryKey,
} from '@/api/feedback/feedback'
import { usePagination } from '@/hooks/usePagination'
import { useToast } from '@/hooks/useToast'
import type {
	FeedbackItemDto,
	GetFeedbackResponseDto,
	GetFeedbackSort,
} from '@/api/model'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'

export function useFeedback() {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const [sort, setSort] = useState<GetFeedbackSort>('recent')
	const [total, setTotal] = useState(0)

	const pagination = usePagination({ initialCount: 10, total })
	const { page, count } = pagination

	const params = { page, count, sort }
	const feedbackKey = getGetFeedbackQueryKey(params)

	const { data, isLoading } = useGetFeedback<GetFeedbackResponseDto>(params)

	useEffect(() => {
		if (data?.total !== undefined) setTotal(data.total)
	}, [data?.total])

	const createMutation = useCreateFeedback({
		mutation: {
			onMutate: async ({ data: body }) => {
				await qc.cancelQueries({ queryKey: feedbackKey })
				const prev = qc.getQueryData<GetFeedbackResponseDto>(feedbackKey)
				const optimistic: FeedbackItemDto = {
					id: `temp-${Date.now()}`,
					by: body.by ?? null,
					content: body.content ?? null,
					imageUrl: body.imageUrl ?? null,
					eventId: null,
					reactions: [],
					reactionTotal: 0,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}
				qc.setQueryData<GetFeedbackResponseDto>(feedbackKey, old => ({
					feedback: [optimistic, ...(old?.feedback ?? [])],
					total: (old?.total ?? 0) + 1,
				}))
				return { prev }
			},
			onError: (_e, _v, ctx) => {
				qc.setQueryData(feedbackKey, ctx?.prev)
				toast.error(t('feedback.post_failed'))
			},
			onSettled: () => qc.invalidateQueries({ queryKey: feedbackKey }),
		},
	})

	const reactMutation = useReactToFeedback({
		mutation: {
			onMutate: async () => {
				await qc.cancelQueries({ queryKey: feedbackKey })
				const prev = qc.getQueryData<GetFeedbackResponseDto>(feedbackKey)
				return { prev }
			},
			onError: (_e, _v, ctx) => qc.setQueryData(feedbackKey, ctx?.prev),
			onSettled: () => qc.invalidateQueries({ queryKey: feedbackKey }),
		},
	})

	const post = (by: string, content: string, imageUrl: string | null) => {
		const trimmed = content.trim()
		if (!trimmed) return
		createMutation.mutate({
			data: {
				by: by.trim() || undefined,
				content: trimmed,
				imageUrl: imageUrl ?? undefined,
			},
		})
	}

	const pendingReactions = useRef<Record<string, Record<string, number>>>({})

	const flushReactions = useDebouncedCallback(() => {
		const current = pendingReactions.current
		pendingReactions.current = {}

		Object.entries(current).forEach(([id, emojis]) => {
			Object.entries(emojis).forEach(([emoji, count]) => {
				if (count > 0) {
					reactMutation.mutate({ id, data: { emoji, count } })
				}
			})
		})
	}, 800)

	const react = (id: string, emoji: string) => {
		qc.setQueryData<GetFeedbackResponseDto>(feedbackKey, old => {
			if (!old) return old
			return {
				...old,
				feedback: old.feedback.map(f => {
					if (f.id !== id) return f
					const existing = f.reactions.find(r => r.emoji === emoji)
					const reactions = existing
						? f.reactions.map(r =>
								r.emoji === emoji ? { ...r, count: r.count + 1 } : r
						  )
						: [...f.reactions, { emoji, count: 1 }]
					return { ...f, reactions, reactionTotal: f.reactionTotal + 1 }
				}),
			}
		})

		if (!pendingReactions.current[id]) pendingReactions.current[id] = {}
		pendingReactions.current[id][emoji] = (pendingReactions.current[id][emoji] || 0) + 1
		flushReactions()
	}

	return {
		feedback: data?.feedback ?? [],
		isLoading,
		sort,
		setSort,
		pagination,
		post,
		react,
		isPosting: createMutation.isPending,
	}
}
