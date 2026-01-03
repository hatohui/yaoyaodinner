import type { Food } from '@/types/models/Food'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FoodCardProps {
	food: Food
}

export function FoodCard({ food }: FoodCardProps) {
	return (
		<Card className='overflow-hidden transition-shadow hover:shadow-lg'>
			{food.imageUrl && (
				<div className='aspect-video w-full overflow-hidden bg-muted'>
					<img
						src={food.imageUrl}
						alt={food.name}
						className='h-full w-full object-cover transition-transform hover:scale-105'
					/>
				</div>
			)}
			<CardHeader>
				<div className='flex items-start justify-between gap-2'>
					<CardTitle className='line-clamp-2'>{food.name}</CardTitle>
					{!food.isAvailable && (
						<Badge variant='destructive' className='shrink-0'>
							Unavailable
						</Badge>
					)}
				</div>
				{food.description && (
					<CardDescription className='line-clamp-2'>
						{food.description}
					</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				<div className='text-sm text-muted-foreground'>
					{food.isChecked ? '✓ Verified' : 'Pending verification'}
				</div>
			</CardContent>
		</Card>
	)
}
