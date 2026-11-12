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
			<div className='flex justify-center rounded-2xl border border-primary/30 bg-card p-4'>
				<Spinner />
			</div>
		)
	}

	if (!roast) {
		return (
			<button
				type='button'
				onClick={onRoast}
				disabled={isRoasting}
				className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 bg-card px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-wait'
			>
				{isRoasting ? (
					<Spinner className='size-4' />
				) : (
					<Flame className='size-4' />
				)}
				{t(isRoasting ? 'roast.roasting' : 'roast.cta_table')}
			</button>
		)
	}

	return (
		<section className='flex flex-col gap-2 rounded-2xl border border-primary/40 bg-card p-4 shadow-sm'>
			<div className='flex items-center justify-between gap-2'>
				<h2 className='flex items-center gap-1.5 text-sm font-semibold text-primary'>
					<Flame className='size-4' />
					{t('roast.title')}
				</h2>
				<Button
					variant='ghost'
					size='sm'
					className='h-7 gap-1.5 rounded-full text-xs text-muted-foreground'
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
