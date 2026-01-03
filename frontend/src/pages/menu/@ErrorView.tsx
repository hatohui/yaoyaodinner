import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

interface ErrorViewProps {
	error: Error
	onRetry?: () => void
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
	return (
		<Card className='mx-auto max-w-md border-destructive'>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<AlertCircle className='h-5 w-5 text-destructive' />
					<CardTitle className='text-destructive'>Error Loading Menu</CardTitle>
				</div>
				<CardDescription>{error.message}</CardDescription>
			</CardHeader>
			{onRetry && (
				<CardContent>
					<Button onClick={onRetry} variant='outline' className='w-full'>
						Try Again
					</Button>
				</CardContent>
			)}
		</Card>
	)
}
