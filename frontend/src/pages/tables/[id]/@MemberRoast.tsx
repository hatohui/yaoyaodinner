import { useTranslation } from 'react-i18next'
import { Flame, RefreshCw } from 'lucide-react'
import type { MemberRoastDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/utils/shadcn'

interface MemberRoastProps {
	name: string
	roast: MemberRoastDto | undefined
	isRoasting: boolean
	compact: boolean
	onRoast: () => void
}

export function MemberRoast({
	name,
	roast,
	isRoasting,
	compact,
	onRoast,
}: MemberRoastProps) {
	const { t } = useTranslation()
	const remaining = roast?.remainingToday ?? 0
	const hasRoast = Boolean(roast?.text)

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type='button'
					aria-label={t('roast.member', { name })}
					title={t('roast.member', { name })}
					className={cn(
						'group pointer-events-auto relative flex shrink-0 cursor-pointer items-center justify-center rounded-full border transition-all active:scale-95',
						hasRoast
							? 'border-orange-500/40 bg-orange-500/15 text-orange-400 hover:border-orange-500 hover:bg-orange-500/25 hover:text-orange-300 shadow-xs shadow-orange-500/20'
							: 'border-orange-500/25 bg-orange-500/10 text-orange-400/80 hover:border-orange-500/50 hover:bg-orange-500/20 hover:text-orange-300',
						compact ? 'size-7' : 'size-8'
					)}
				>
					<Flame
						className={cn(
							'size-4 transition-transform motion-safe:animate-flame',
							hasRoast
								? 'fill-orange-400/40 text-orange-400 group-hover:scale-110'
								: 'text-orange-400/80 group-hover:scale-110 group-hover:text-orange-300'
						)}
					/>
				</button>
			</PopoverTrigger>
			<PopoverContent
				align='end'
				className='flex w-72 flex-col gap-2 rounded-2xl border-orange-500/40 text-sm shadow-lg shadow-orange-500/10'
			>
				<p className='text-xs font-semibold text-orange-400'>{name}</p>
				{hasRoast ? (
					<p className='leading-relaxed text-foreground'>{roast?.text}</p>
				) : (
					<p className='text-muted-foreground'>
						{t('roast.member_empty', { name })}
					</p>
				)}
				{roast?.isStale && (
					<p className='text-xs text-muted-foreground'>
						{t('roast.stale_member')}
					</p>
				)}
				<div className='flex items-center justify-between gap-2 pt-1'>
					<span className='text-xs text-muted-foreground'>
						{t('roast.left_today', { count: remaining })}
					</span>
					<Button
						size='sm'
						variant='default'
						className='h-7 gap-1.5 rounded-full border border-orange-500/40 bg-gradient-to-r from-orange-500 to-amber-500 px-3 text-xs font-medium text-white shadow-xs transition-all hover:from-orange-600 hover:to-amber-600 active:scale-95 disabled:opacity-50'
						disabled={isRoasting || remaining === 0}
						onClick={onRoast}
					>
						{isRoasting ? (
							<Spinner className='size-3.5' />
						) : hasRoast ? (
							<RefreshCw className='size-3.5' />
						) : (
							<Flame className='size-3.5 fill-white motion-safe:animate-flame' />
						)}
						{t(hasRoast ? 'roast.again' : 'roast.cta_member')}
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}
