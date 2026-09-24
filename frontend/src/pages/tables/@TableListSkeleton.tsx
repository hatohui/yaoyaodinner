import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/shadcn'

const cardClass =
	'flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm'

function TableCardSkeleton() {
	return (
		<div className={cardClass}>
			<div className='relative h-24 w-full'>
				<Skeleton className='size-full rounded-none' />
				<Skeleton className='absolute bottom-2 left-2 size-8 rounded-full bg-card/90' />
			</div>
			<div className='flex flex-col gap-2.5 px-4 py-3.5'>
				<Skeleton className='h-5 w-2/3 rounded-full' />
				<div className='flex items-center justify-between gap-2'>
					<div className='flex items-center gap-1'>
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton
								key={i}
								className='size-2.5 rounded-full bg-primary/15'
							/>
						))}
					</div>
					<Skeleton className='h-3.5 w-16 rounded-full' />
				</div>
			</div>
		</div>
	)
}

function TableCompactCardSkeleton() {
	return (
		<div className={cn(cardClass, 'gap-2 p-3')}>
			<div className='flex items-center gap-2'>
				<Skeleton className='size-6 shrink-0 rounded-full' />
				<Skeleton className='h-4 w-2/3 rounded-full' />
			</div>
			<div className='flex items-center justify-between gap-1.5'>
				<Skeleton className='h-5 w-12 rounded-full bg-primary/15' />
				<Skeleton className='h-3 w-14 rounded-full' />
			</div>
		</div>
	)
}

interface TableListSkeletonProps {
	compact?: boolean
}

export function TableListSkeleton({ compact }: TableListSkeletonProps) {
	const Card = compact ? TableCompactCardSkeleton : TableCardSkeleton

	return (
		<ul
			className={cn(
				'grid gap-3',
				compact
					? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
					: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
			)}
		>
			{Array.from({ length: compact ? 12 : 10 }).map((_, i) => (
				<li key={i}>
					<Card />
				</li>
			))}
		</ul>
	)
}
