import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { FeedbackItemDto } from '@/api/model'
import { useConfig } from '@/hooks/useConfig'
import { ViewableImage } from '@/components/common/ViewableImage'
import { cn } from '@/utils/shadcn'

interface FeedbackCardProps {
	item: FeedbackItemDto
	onReact: (emoji: string) => void
}

export function FeedbackCard({ item, onReact }: FeedbackCardProps) {
	const { t, i18n } = useTranslation()
	const { suggestedReactions } = useConfig()

	return (
		<div className='flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-semibold text-foreground'>
					{item.by || t('feedback.anonymous')}
				</span>
				<span className='text-xs text-muted-foreground'>
					{new Intl.DateTimeFormat(i18n.language, {
						dateStyle: 'medium',
						timeStyle: 'short',
					}).format(new Date(item.createdAt))}
				</span>
			</div>
			{item.content && (
				<div
					className={cn(
						'text-sm text-foreground',
						'[&_p]:mb-2 [&_p:last-child]:mb-0',
						'[&_strong]:font-semibold [&_em]:italic',
						'[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5',
						'[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5',
						'[&_li]:mb-0.5',
						'[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
						'[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs'
					)}
				>
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{item.content}
					</ReactMarkdown>
				</div>
			)}

			<ViewableImage
				imageKey={item.imageUrl}
				className='w-full'
				imgClassName='max-h-72 w-full rounded-xl object-cover'
			/>

			<div className='flex flex-wrap items-center gap-1.5 pt-1'>
				{suggestedReactions.map(emoji => {
					const reaction = item.reactions.find(r => r.emoji === emoji)
					return (
						<button
							key={emoji}
							type='button'
							onClick={() => onReact(emoji)}
							className={cn(
								'flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-sm transition-colors hover:bg-muted',
								reaction &&
									reaction.count > 0 &&
									'border-primary/40 bg-brand-muted'
							)}
						>
							<span>{emoji}</span>
							{reaction && reaction.count > 0 && (
								<span className='text-xs font-medium text-muted-foreground'>
									{reaction.count}
								</span>
							)}
						</button>
					)
				})}
			</div>
		</div>
	)
}
