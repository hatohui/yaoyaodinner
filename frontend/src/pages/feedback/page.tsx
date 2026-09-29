import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { PaginationBar } from '@/components/common/PaginationBar'
import { FeedbackForm } from './@FeedbackForm'
import { FeedbackCard } from './@FeedbackCard'
import { useFeedback } from './@useFeedback'
import { useDeleteFeedback } from '@/hooks/useDeleteFeedback'
import { useEditMode } from '@/hooks/useEditMode'
import { cn } from '@/utils/shadcn'

export default function FeedbackPage() {
	const { t } = useTranslation()
	const {
		feedback,
		isLoading,
		sort,
		setSort,
		pagination,
		post,
		react,
		isPosting,
	} = useFeedback()
	const { editing } = useEditMode()
	const { deleteFeedback } = useDeleteFeedback()

	return (
		<div className='mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6'>
			<h1 className='text-xl font-bold text-foreground'>
				{t('feedback.title')}
			</h1>

			<FeedbackForm onPost={post} isPosting={isPosting} />

			<div className='flex items-center gap-2'>
				{(['recent', 'top'] as const).map(option => (
					<button
						key={option}
						type='button'
						onClick={() => setSort(option)}
						className={cn(
							'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
							sort === option
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border/60 bg-card text-muted-foreground hover:bg-muted'
						)}
					>
						{t(`feedback.sort_${option}`)}
					</button>
				))}
			</div>

			{isLoading ? (
				<div className='flex justify-center py-10'>
					<Spinner />
				</div>
			) : feedback.length === 0 ? (
				<p className='py-10 text-center text-sm text-muted-foreground'>
					{t('feedback.empty')}
				</p>
			) : (
				<>
					<div className='flex justify-center sm:hidden'>
						<PaginationBar pagination={pagination} showPageSize />
					</div>
					<div className='flex flex-col gap-3'>
						{feedback.map(item => (
							<FeedbackCard
								key={item.id}
								item={item}
								onReact={emoji => react(item.id, emoji)}
								onDelete={editing ? () => deleteFeedback(item.id) : undefined}
							/>
						))}
					</div>
				</>
			)}

			<div className='flex justify-center pt-2'>
				<PaginationBar pagination={pagination} showPageSize />
			</div>
		</div>
	)
}
