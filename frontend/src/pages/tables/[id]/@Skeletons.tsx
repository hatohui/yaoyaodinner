import { Skeleton } from '@/components/ui/skeleton'

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

export function RosterSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<ul className='flex flex-col gap-2 sm:gap-3'>
			{range(rows).map(i => (
				<li
					key={i}
					className='flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm sm:gap-4 sm:px-5 sm:py-4'
				>
					<Skeleton className='size-11 shrink-0 rounded-full bg-primary/15 sm:size-12' />
					<div className='flex flex-1 flex-col gap-2'>
						<Skeleton className='h-4 w-1/3 rounded-full' />
						<Skeleton className='h-3 w-1/2 rounded-full' />
					</div>
				</li>
			))}
		</ul>
	)
}

export function OrderListSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<ul className='flex flex-col gap-2'>
			{range(rows).map(i => (
				<li
					key={i}
					className='flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm'
				>
					<div className='flex items-start gap-3'>
						<Skeleton className='size-12 shrink-0 rounded-lg' />
						<div className='flex flex-1 flex-col gap-2'>
							<Skeleton className='h-4 w-2/3 rounded-full' />
							<Skeleton className='h-5 w-24 rounded-full bg-primary/15' />
						</div>
					</div>
					<div className='flex items-center justify-between'>
						<Skeleton className='h-7 w-24 rounded-full' />
						<Skeleton className='h-4 w-16 rounded-full' />
					</div>
				</li>
			))}
		</ul>
	)
}

export function SplitsSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<div className='flex flex-col gap-2'>
			<Skeleton className='h-11 w-full rounded-2xl bg-primary/15' />
			<ul className='flex flex-col gap-2'>
				{range(rows).map(i => (
					<li
						key={i}
						className='flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm'
					>
						<Skeleton className='h-4 w-1/3 rounded-full' />
						<Skeleton className='h-4 w-20 rounded-full' />
					</li>
				))}
			</ul>
		</div>
	)
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className='grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3'>
			{range(count).map(i => (
				<div
					key={i}
					className='flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm'
				>
					<Skeleton className='aspect-[4/3] w-full rounded-none border-b border-border' />
					<div className='flex flex-col gap-2 p-3'>
						<Skeleton className='h-4 w-4/5 rounded-full' />
						<div className='mt-1 flex items-center justify-between'>
							<Skeleton className='h-4 w-14 rounded-full bg-primary/15' />
							<Skeleton className='h-8 w-16 rounded-full' />
						</div>
					</div>
				</div>
			))}
		</div>
	)
}
