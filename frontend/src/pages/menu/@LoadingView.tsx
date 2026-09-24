import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

export function LoadingView() {
	return (
		<div className='grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
			{Array.from({ length: 10 }).map((_, i) => (
				<div
					key={i}
					className='flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md'
				>
					<div className='relative aspect-[4/3] bg-muted'>
						<Skeleton className='size-full rounded-none' />
						<Skeleton className='absolute bottom-2 right-2 h-7 w-16 rounded-full bg-card/90' />
					</div>
					<div className='flex flex-col gap-1.5 px-3.5 pb-3.5 pt-3'>
						<Skeleton className='h-3 w-1/3 rounded-full bg-primary/15' />
						<Skeleton className='h-4 w-4/5 rounded-full sm:h-5' />
						<div className='hidden space-y-1.5 pt-0.5 sm:block'>
							<Skeleton className='h-3.5 w-full rounded-full' />
							<Skeleton className='h-3.5 w-2/3 rounded-full' />
						</div>
					</div>
				</div>
			))}
		</div>
	)
}

export function LoadingSpinner() {
	return (
		<div className='flex min-h-[300px] items-center justify-center'>
			<Spinner className='h-8 w-8 text-primary' />
		</div>
	)
}
