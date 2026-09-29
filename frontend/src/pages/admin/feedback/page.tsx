import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { PaginationBar } from '@/components/common/PaginationBar'
import { useDeleteFeedback } from '@/hooks/useDeleteFeedback'
import { cn } from '@/utils/shadcn'
import { AdminFeedbackCard } from './@AdminFeedbackCard'
import { useAdminFeedback } from './@useAdminFeedback'

export default function AdminFeedbackPage() {
	const { t } = useTranslation()
	const { sort, setSort, pagination, feedback, isLoading } = useAdminFeedback()
	const { deleteFeedback } = useDeleteFeedback()

	return (
		<div className='flex flex-col gap-4'>
			<h1 className='text-xl font-bold text-foreground'>
				{t('admin.feedback.title')}
			</h1>

			<div className='flex flex-wrap items-center justify-end gap-2'>
				<div className='flex items-center gap-1 rounded-full border border-border/60 p-0.5'>
					{(['recent', 'top'] as const).map(s => (
						<button
							key={s}
							type='button'
							onClick={() => setSort(s)}
							className={cn(
								'rounded-full px-3 py-1 text-xs font-medium transition-colors',
								sort === s
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground'
							)}
						>
							{s === 'recent'
								? t('feedback.sort_recent')
								: t('feedback.sort_top')}
						</button>
					))}
				</div>
			</div>

			{isLoading ? (
				<div className='flex justify-center py-16'>
					<Spinner />
				</div>
			) : feedback.length === 0 ? (
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('feedback.empty')}
				</p>
			) : (
				<div className='grid gap-3 sm:grid-cols-2'>
					{feedback.map(item => (
						<AdminFeedbackCard
							key={item.id}
							item={item}
							onDelete={() => deleteFeedback(item.id)}
						/>
					))}
				</div>
			)}

			<div className='flex justify-center'>
				<PaginationBar pagination={pagination} />
			</div>
		</div>
	)
}
