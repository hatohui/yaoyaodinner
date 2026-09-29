import { useTranslation } from 'react-i18next'
import type { FeedbackItemDto } from '@/api/model'
import { DeleteFeedbackButton } from '@/components/common/DeleteFeedbackButton'

interface AdminFeedbackCardProps {
	item: FeedbackItemDto
	onDelete: () => void
}

export function AdminFeedbackCard({ item, onDelete }: AdminFeedbackCardProps) {
	const { t } = useTranslation()

	return (
		<div className='flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-semibold text-foreground'>
					{item.by || t('feedback.anonymous')}
				</span>
				<div className='flex items-center gap-1'>
					{item.reactionTotal > 0 && (
						<span className='text-xs text-muted-foreground'>
							{t('admin.feedback.reaction_count', {
								count: item.reactionTotal,
							})}
						</span>
					)}
					<DeleteFeedbackButton onDelete={onDelete} />
				</div>
			</div>
			{item.content && (
				<p className='text-sm text-foreground'>{item.content}</p>
			)}

			{item.reactions.length > 0 && (
				<div className='flex flex-wrap items-center gap-1.5 pt-1'>
					{item.reactions
						.filter(r => r.count > 0)
						.map(r => (
							<span
								key={r.emoji}
								className='flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-sm'
							>
								<span>{r.emoji}</span>
								<span className='text-xs font-medium text-muted-foreground'>
									{r.count}
								</span>
							</span>
						))}
				</div>
			)}
		</div>
	)
}
