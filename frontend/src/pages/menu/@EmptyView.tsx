import { Info } from 'lucide-react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export function EmptyView() {
	return (
		<Card className='mx-auto max-w-md'>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Info className='h-5 w-5 text-muted-foreground' />
					<CardTitle>No Items Found</CardTitle>
				</div>
				<CardDescription>
					There are no menu items available at the moment. Please check back
					later or try a different category.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className='text-sm text-muted-foreground'>
					Tip: You can also try clearing your filters or searching for something
					else.
				</p>
			</CardContent>
		</Card>
	)
}
