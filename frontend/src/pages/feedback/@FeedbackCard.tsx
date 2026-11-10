import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Share2 } from 'lucide-react'
import type { FeedbackItemDto } from '@/api/model'
import { useConfig } from '@/hooks/useConfig'
import { useToast } from '@/hooks/useToast'
import { DeleteFeedbackButton } from '@/components/common/DeleteFeedbackButton'
import { ViewableImage } from '@/components/common/ViewableImage'
import { cn } from '@/utils/shadcn'
import { FeedbackAuthor } from './@FeedbackAuthor'

interface FeedbackCardProps {
	item: FeedbackItemDto
	onReact: (emoji: string) => void
	onDelete?: () => void
	isHighlighted?: boolean
}

export function FeedbackCard({
	item,
	onReact,
	onDelete,
	isHighlighted = false,
}: FeedbackCardProps) {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const { suggestedReactions } = useConfig()

	const shareLink = () => {
		const url = new URL(`${window.location.origin}/feedback`)
		url.searchParams.set('id', item.id)
		if (i18n.language && i18n.language !== 'en') {
			url.searchParams.set('lang', i18n.language)
		}
		navigator.clipboard?.writeText(url.toString())
		toast.success(t('feedback.link_copied'))
	}

	return (
		<div
			id={`feedback-${item.id}`}
			data-feedback-id={item.id}
			className={cn(
				'relative flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm transition-all',
				isHighlighted
					? 'border-primary ring-2 ring-primary shadow-md'
					: 'border-border/60'
			)}
		>
			{isHighlighted && (
				<span
					className='pointer-events-none absolute -inset-1 rounded-[inherit] ring-4 ring-primary/60 motion-safe:animate-pulse'
					aria-hidden
				/>
			)}
			<div className='flex items-center justify-between'>
				<FeedbackAuthor by={item.by} author={item.author} />
				<div className='flex items-center gap-1'>
					<span className='text-xs text-muted-foreground'>
						{new Intl.DateTimeFormat(i18n.language, {
							dateStyle: 'medium',
							timeStyle: 'short',
						}).format(new Date(item.createdAt))}
					</span>
					<button
						type='button'
						onClick={shareLink}
						aria-label={t('feedback.copy_link')}
						title={t('feedback.copy_link')}
						className='inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<Share2 className='size-3.5' />
					</button>
					{onDelete && <DeleteFeedbackButton onDelete={onDelete} />}
				</div>
			</div>
			{item.content && (
				<div
					className={cn(
						'min-w-0 text-sm text-foreground [overflow-wrap:anywhere]',
						'[&_p]:mb-2 [&_p:last-child]:mb-0',
						'[&_strong]:font-semibold [&_em]:italic',
						'[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5',
						'[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5',
						'[&_li]:mb-0.5',
						'[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
						'[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs'
					)}
				>
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						disallowedElements={['img']}
					>
						{item.content}
					</ReactMarkdown>
				</div>
			)}

			<ViewableImage
				imageKey={item.imageUrl}
				className='w-full'
				imgClassName='max-h-96 w-full rounded-xl bg-muted object-contain'
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
