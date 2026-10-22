import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Armchair, NotebookText } from 'lucide-react'
import type { FeedbackAuthorDto } from '@/api/model'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { StoredImage } from '@/components/common/StoredImage'
import { cn } from '@/utils/shadcn'

const CLOSE_DELAY_MS = 150

interface FeedbackAuthorProps {
	by: string | null
	author?: FeedbackAuthorDto | null
}

export function FeedbackAuthor({ by, author }: FeedbackAuthorProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	if (!author) {
		return (
			<span className='text-sm font-semibold text-foreground'>
				{by || t('feedback.anonymous')}
			</span>
		)
	}

	// hover opens it for mice; touch still opens it by tapping
	const hover = {
		onPointerEnter: (e: React.PointerEvent) => {
			if (e.pointerType !== 'mouse') return
			if (closeTimer.current) clearTimeout(closeTimer.current)
			setOpen(true)
		},
		onPointerLeave: (e: React.PointerEvent) => {
			if (e.pointerType !== 'mouse') return
			closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
		},
	}

	const avatar = (size: string) => (
		<span
			className={cn(
				'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground',
				size
			)}
		>
			<StoredImage
				imageKey={author.pfpUrl}
				className='size-full object-cover'
				fallback={author.name.charAt(0).toUpperCase()}
			/>
		</span>
	)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type='button'
					{...hover}
					className='flex min-w-0 items-center gap-2 rounded-full text-sm font-semibold text-foreground transition-colors hover:text-primary'
				>
					{avatar('size-6 text-[10px]')}
					<span className='truncate'>{author.name}</span>
				</button>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				{...hover}
				className='flex w-64 flex-col gap-3 rounded-2xl p-4'
			>
				<div className='flex items-center gap-3'>
					{avatar('size-12 text-base')}
					<div className='min-w-0'>
						<p className='truncate font-semibold text-foreground'>
							{author.name}
						</p>
						{author.tableName && (
							<p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
								<Armchair className='size-3.5 shrink-0 text-primary' />
								<span className='truncate'>
									{t('feedback.author_table', {
										no: author.tableNo,
										name: author.tableName,
									})}
								</span>
							</p>
						)}
					</div>
				</div>

				{author.note && (
					<p className='flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm text-foreground/85'>
						<NotebookText className='mt-0.5 size-3.5 shrink-0 text-primary' />
						{author.note}
					</p>
				)}

				{author.tableId && (
					<Link
						to={`/tables/${author.tableId}`}
						className='flex items-center justify-center gap-1.5 rounded-full border border-border bg-control px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
					>
						<Armchair className='size-4' />
						{t('feedback.go_to_table')}
					</Link>
				)}
			</PopoverContent>
		</Popover>
	)
}
