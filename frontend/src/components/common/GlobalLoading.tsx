import { Spinner } from '@/components/ui/spinner'

export const GlobalLoading = () => {
	return (
		<div className='flex min-h-screen items-center justify-center bg-background'>
			<Spinner className='size-6 text-primary' />
		</div>
	)
}
