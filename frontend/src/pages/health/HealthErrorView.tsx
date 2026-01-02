import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from '@/components/ui/card'
import React from 'react'

const HealthErrorView = ({ error }: { error: Error }): React.ReactElement => {
	return (
		<div className='flex min-h-screen items-center justify-center p-4'>
			<Card className='w-full max-w-md border-destructive'>
				<CardHeader>
					<CardTitle className='text-destructive'>Error</CardTitle>
					<CardDescription>Failed to fetch health status</CardDescription>
				</CardHeader>
				<CardContent>
					<p className='text-sm text-muted-foreground'>
						{error instanceof Error ? error.message : 'Unknown error occurred'}
					</p>
				</CardContent>
			</Card>
		</div>
	)
}

export default HealthErrorView
