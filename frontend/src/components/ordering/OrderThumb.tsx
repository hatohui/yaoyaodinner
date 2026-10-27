import { UtensilsCrossed } from 'lucide-react'
import { StoredImage } from '@/components/common/StoredImage'
import { cn } from '@/utils/shadcn'

interface OrderThumbProps {
	imageKey: string | null | undefined
	alt: string
	className?: string
}

export function OrderThumb({ imageKey, alt, className }: OrderThumbProps) {
	return (
		<div
			className={cn(
				'flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted',
				className
			)}
		>
			<StoredImage
				imageKey={imageKey}
				alt={alt}
				className='h-full w-full object-cover'
				fallback={<UtensilsCrossed className='size-5 text-muted-foreground' />}
			/>
		</div>
	)
}
