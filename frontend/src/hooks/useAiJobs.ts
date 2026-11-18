import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
	getGetAiJobsQueryKey,
	useGetAiJobs,
} from '@/api/content-health/content-health'
import type { AiBatchProgressDto, AiJobsDto } from '@/api/model'

const POLL_MS = 2_000

type Settled = (id: string, status: 'done' | 'failed') => void
type BatchSettled = (batch: AiBatchProgressDto) => void

export function useAiJobs({
	onSettled,
	onBatchSettled,
	onBatchProgress,
}: {
	onSettled?: Settled
	onBatchSettled?: BatchSettled
	onBatchProgress?: () => void
} = {}) {
	const qc = useQueryClient()
	const [watching, setWatching] = React.useState<string[]>([])
	const [batchStarted, setBatchStarted] = React.useState(false)
	const [optimisticBatch, setOptimisticBatch] =
		React.useState<AiBatchProgressDto | null>(null)
	const lastBatch = React.useRef<AiBatchProgressDto | null>(null)

	const { data } = useGetAiJobs<AiJobsDto>(
		{ ids: watching.join(',') || undefined },
		{
			query: {
				refetchInterval: query =>
					watching.length > 0 || batchStarted || query.state.data?.batch
						? POLL_MS
						: false,
			},
		}
	)

	const callbacks = React.useRef({ onSettled, onBatchSettled, onBatchProgress })
	callbacks.current = { onSettled, onBatchSettled, onBatchProgress }

	React.useEffect(() => {
		if (!data) return
		const settled = data.jobs.filter(
			j => j.status !== 'pending' && watching.includes(j.id)
		)
		if (settled.length > 0) {
			setWatching(prev => prev.filter(id => !settled.some(j => j.id === id)))
			for (const job of settled)
				callbacks.current.onSettled?.(job.id, job.status as 'done' | 'failed')
		}

		const prev = lastBatch.current
		if (data.batch) {
			if (prev?.done !== data.batch.done) callbacks.current.onBatchProgress?.()
			lastBatch.current = data.batch
			setOptimisticBatch(null)
			setBatchStarted(false)
		} else if (prev && !batchStarted) {
			lastBatch.current = null
			setOptimisticBatch(null)
			callbacks.current.onBatchSettled?.({ ...prev, done: prev.total })
		} else if (
			prev &&
			batchStarted &&
			data.lastBatchErrors?.batchId === prev.id
		) {
			lastBatch.current = null
			setOptimisticBatch(null)
			setBatchStarted(false)
			callbacks.current.onBatchSettled?.({
				...prev,
				done: prev.total,
				failed: data.lastBatchErrors.errors.length,
			})
		}
	}, [data, watching, batchStarted])

	return {
		pendingIds: React.useMemo(() => new Set(watching), [watching]),
		batch: data?.batch ?? optimisticBatch,
		lastBatchErrors: data?.lastBatchErrors ?? null,
		watch: (id: string) =>
			setWatching(prev => (prev.includes(id) ? prev : [...prev, id])),
		watchBatch: (batch: AiBatchProgressDto) => {
			lastBatch.current = batch
			setOptimisticBatch(batch)
			setBatchStarted(true)
			void qc.invalidateQueries({ queryKey: getGetAiJobsQueryKey() })
		},
	}
}
