import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/shadcn'

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

/** Mimics the DataGrid: header row + N body rows with column cells. */
export function DataGridSkeleton({
	rows = 10,
	columns = 4,
}: {
	rows?: number
	columns?: number
}) {
	return (
		<div className='overflow-hidden rounded-xl border bg-card shadow-sm'>
			<div className='flex gap-4 border-b bg-muted/60 px-3 py-2.5'>
				<Skeleton className='h-4 w-6 rounded-full' />
				{range(columns).map(i => (
					<Skeleton key={i} className='h-4 flex-1 rounded-full' />
				))}
			</div>
			{range(rows).map(r => (
				<div
					key={r}
					className='flex items-center gap-4 border-b px-3 py-2.5 last:border-b-0'
				>
					<Skeleton className='h-3.5 w-6 rounded-full' />
					{range(columns).map(c => (
						<Skeleton
							key={c}
							className={cn(
								'h-3.5 flex-1 rounded-full',
								c === 1 && 'h-5 max-w-28 bg-primary/15',
								(r + c) % 3 === 0 && 'max-w-[60%]'
							)}
						/>
					))}
				</div>
			))}
		</div>
	)
}

/** Generic bordered card grid placeholder. */
export function CardGridSkeleton({
	count = 6,
	className,
	lines = 2,
}: {
	count?: number
	className?: string
	lines?: number
}) {
	return (
		<ul className={cn('grid gap-3 sm:grid-cols-2', className)}>
			{range(count).map(i => (
				<li
					key={i}
					className='flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 shadow-sm'
				>
					<div className='flex items-center gap-2'>
						<Skeleton className='size-7 shrink-0 rounded-full bg-primary/15' />
						<Skeleton className='h-4 w-1/2 rounded-full' />
					</div>
					{range(lines).map(l => (
						<Skeleton
							key={l}
							className={cn(
								'h-3.5 rounded-full',
								l === lines - 1 ? 'w-2/3' : 'w-full'
							)}
						/>
					))}
				</li>
			))}
		</ul>
	)
}
