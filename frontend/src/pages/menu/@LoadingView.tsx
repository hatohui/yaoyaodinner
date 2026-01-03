import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export function LoadingView() {
	return (
		<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
			{Array.from({ length: 6 }).map((_, i) => (
				<Card key={i} className='overflow-hidden'>
					<div className='aspect-video w-full animate-pulse bg-muted' />
					<CardContent className='space-y-3 p-6'>
						<div className='h-6 w-3/4 animate-pulse rounded bg-muted' />
						<div className='h-4 w-full animate-pulse rounded bg-muted' />
						<div className='h-4 w-2/3 animate-pulse rounded bg-muted' />
					</CardContent>
				</Card>
			))}
		</div>
	)
}

export function LoadingSpinner() {
	return (
		<div className='flex min-h-[400px] items-center justify-center'>
			<Spinner className='h-8 w-8' />
		</div>
	)
}
