import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flame, RefreshCw } from 'lucide-react'
import type { TableRoastDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { burstFlames, startBurning } from '@/utils/fireFx'
import { cn } from '@/utils/shadcn'
import { RoastText } from './@RoastText'

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
	const ref = useRef<HTMLElement>(null)
	const [fresh, setFresh] = useState(false)

	useEffect(() => {
		if (!isRoasting || !ref.current) return
		setFresh(true)
		return startBurning(ref.current)
	}, [isRoasting])

	useEffect(() => {
		if (roast?.text && ref.current) burstFlames(ref.current, 14)
	}, [roast?.text])

	if (isLoading) {
		return (
			<div className='flex justify-center rounded-2xl border border-fire/30 bg-card p-4'>
				<Spinner />
			</div>
		)
	}

	if (!roast && !isRoasting) return null

	return (
		<section
			ref={ref}
			className={cn(
				'relative flex flex-col gap-2 rounded-2xl border bg-card p-4',
				isRoasting
					? 'border-fire animate-ember'
					: 'border-fire/40 shadow-sm shadow-fire/10'
			)}
		>
			<div className='flex items-center justify-between gap-2'>
				<h2 className='flex items-center gap-1.5 text-sm font-semibold text-fire'>
					<Flame className='size-4 fill-fire/40 text-fire motion-safe:animate-flame' />
					{t(isRoasting ? 'roast.roasting' : 'roast.title')}
				</h2>
				{roast && (
					<Button
						variant='ghost'
						size='sm'
						className='h-7 gap-1.5 rounded-full text-xs text-fire transition-transform hover:bg-fire/10 hover:text-fire active:scale-95'
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
				)}
			</div>
			{isRoasting ? (
				<div className='flex flex-col gap-2'>
					<div className='h-4 w-5/6 animate-pulse rounded-md bg-fire/15' />
					<div className='h-4 w-4/6 animate-pulse rounded-md bg-fire/10' />
				</div>
			) : (
				roast && (
					<RoastText
						text={roast.text}
						animate={fresh}
						className='text-base font-semibold text-foreground'
					/>
				)
			)}
			{roast?.isStale && !isRoasting && (
				<p className='text-xs text-muted-foreground'>
					{t('roast.stale_table')}
				</p>
			)}
		</section>
	)
}
