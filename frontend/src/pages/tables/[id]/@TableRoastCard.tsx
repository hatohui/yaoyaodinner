import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Flame, RefreshCw, Trash2 } from 'lucide-react'
import type { TableRoastDto } from '@/api/model'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useEditMode } from '@/hooks/useEditMode'
import { burstFlames, startBurning } from '@/utils/fireFx'
import { cn } from '@/utils/shadcn'
import { localStorage } from '@/utils/localstorage'
import { TABLE_ROAST_COLLAPSED_STORAGE_KEY } from '@/common/constants'

const saveCollapsed = (collapsed: boolean) =>
	localStorage.save(TABLE_ROAST_COLLAPSED_STORAGE_KEY, String(collapsed))
import { RoastText } from './@RoastText'

interface TableRoastCardProps {
	roast: TableRoastDto | null
	isLoading: boolean
	isRoasting: boolean
	onRoast?: () => void
	onClear?: () => void
	isClearing?: boolean
}

export function TableRoastCard({
	roast,
	isLoading,
	isRoasting,
	onRoast,
	onClear,
	isClearing,
}: TableRoastCardProps) {
	const { t } = useTranslation()
	const { editing } = useEditMode()
	const ref = useRef<HTMLElement>(null)
	const [fresh, setFresh] = useState(false)
	const [collapsed, setCollapsedState] = useState(
		() => localStorage.load(TABLE_ROAST_COLLAPSED_STORAGE_KEY) === 'true'
	)
	const setCollapsed = (next: boolean) => {
		setCollapsedState(next)
		saveCollapsed(next)
	}

	useEffect(() => {
		if (!isRoasting || !ref.current) return
		setFresh(true)
		setCollapsedState(false)
		saveCollapsed(false)
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
				<button
					type='button'
					onClick={() => setCollapsed(!collapsed)}
					aria-expanded={!collapsed}
					className='flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-fire transition-opacity hover:opacity-80'
				>
					<Flame className='size-4 fill-fire/40 text-fire motion-safe:animate-flame' />
					<span>{t(isRoasting ? 'roast.roasting' : 'roast.title')}</span>
					<ChevronDown
						className={cn(
							'size-4 text-fire/70 transition-transform duration-200',
							collapsed ? '-rotate-90' : 'rotate-0'
						)}
					/>
				</button>
				<div className='flex items-center gap-1'>
					{editing && onClear && (
						<Button
							variant='ghost'
							size='sm'
							className='h-7 gap-1 rounded-full text-xs text-muted-foreground transition-transform hover:bg-destructive/10 hover:text-destructive active:scale-95'
							disabled={isRoasting || isClearing}
							onClick={onClear}
							title={t('admin.roast.clear_table', 'Clear table roasts')}
						>
							{isClearing ? (
								<Spinner className='size-3.5' />
							) : (
								<Trash2 className='size-3.5' />
							)}
						</Button>
					)}
					{roast && onRoast && (
						<Button
							variant='ghost'
							size='sm'
							className='h-7 gap-1.5 rounded-full text-xs text-fire transition-transform hover:bg-fire/10 hover:text-fire active:scale-95'
							disabled={isRoasting || isClearing}
							onClick={() => {
								if (ref.current) burstFlames(ref.current, 10)
								onRoast()
							}}
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
			</div>
			{!collapsed && (
				<>
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
					{roast && !isRoasting && (
						<p className='text-xs text-muted-foreground'>
							{t('roast.hide_tip')}
						</p>
					)}
				</>
			)}
		</section>
	)
}
