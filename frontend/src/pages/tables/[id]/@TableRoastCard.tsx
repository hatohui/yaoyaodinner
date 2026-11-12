import { useTranslation } from 'react-i18next'
import { Flame, RefreshCw } from 'lucide-react'
import type { TableRoastDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface TableRoastCardProps {
	roast: TableRoastDto | null
	isLoading: boolean
	isRoasting: boolean
	onRoast: () => void
}

export function TableRoastCard({
	roast,
	isLoading,
	isRoasting,
	onRoast,
}: TableRoastCardProps) {
	const { t } = useTranslation()

	if (isLoading) {
		return (
			<div className='flex justify-center rounded-2xl border border-orange-500/30 bg-card p-4'>
				<Spinner />
			</div>
		)
	}

	if (isRoasting) {
		return (
			<section className='flex flex-col gap-3 rounded-2xl border border-orange-500/40 bg-card p-4 shadow-md shadow-orange-500/10 motion-safe:animate-pulse'>
				<div className='flex items-center gap-2 text-orange-400'>
					<Flame className='size-4 fill-orange-400 motion-safe:animate-bounce' />
					<span className='text-sm font-semibold'>{t('roast.roasting')}</span>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='h-4 w-5/6 rounded-md bg-orange-500/15 animate-pulse' />
					<div className='h-4 w-4/6 rounded-md bg-orange-500/10 animate-pulse' />
				</div>
			</section>
		)
	}

	if (!roast) {
		return null
	}

	return (
		<section className='flex flex-col gap-2 rounded-2xl border border-orange-500/30 bg-card p-4 shadow-sm'>
			<div className='flex items-center justify-between gap-2'>
				<h2 className='flex items-center gap-1.5 text-sm font-semibold text-orange-400'>
					<Flame className='size-4 fill-orange-400/30 text-orange-400 motion-safe:animate-flame' />
					{t('roast.title')}
				</h2>
				<Button
					variant='ghost'
					size='sm'
					className='h-7 gap-1.5 rounded-full text-xs text-orange-400 transition-all hover:bg-orange-500/10 hover:text-orange-300 active:scale-95'
					disabled={isRoasting}
					onClick={onRoast}
				>
					{isRoasting ? (
						<Spinner className='size-3.5' />
					) : (
						<RefreshCw className='size-3.5' />
					)}
					{t('roast.again')}
				</Button>
			</div>
			<p className='text-sm leading-relaxed text-foreground'>{roast.text}</p>
			{roast.isStale && (
				<p className='text-xs text-muted-foreground'>
					{t('roast.stale_table')}
				</p>
			)}
		</section>
	)
}
