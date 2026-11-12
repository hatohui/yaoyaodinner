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
						'pointer-events-auto relative flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-primary/10',
						hasRoast ? 'text-primary' : 'text-muted-foreground',
						compact ? 'size-7' : 'size-8'
					)}
				>
					<Flame className='size-4' />
				</button>
			</PopoverTrigger>
			<PopoverContent
				align='end'
				className='flex w-72 flex-col gap-2 rounded-2xl border-primary/40 text-sm'
			>
				<p className='text-xs font-semibold text-primary'>{name}</p>
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
				<div className='flex items-center justify-between gap-2'>
					<span className='text-xs text-muted-foreground'>
						{t('roast.left_today', { count: remaining })}
					</span>
					<Button
						size='sm'
						variant={hasRoast ? 'ghost' : 'default'}
						className='h-7 gap-1.5 rounded-full text-xs'
						disabled={isRoasting || remaining === 0}
						onClick={onRoast}
					>
						{isRoasting ? (
							<Spinner className='size-3.5' />
						) : hasRoast ? (
							<RefreshCw className='size-3.5' />
						) : (
							<Flame className='size-3.5' />
						)}
						{t(hasRoast ? 'roast.again' : 'roast.cta_member')}
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}
