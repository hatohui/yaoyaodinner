import { UtensilsCrossed } from 'lucide-react'
import { StoredImage } from '@/components/common/StoredImage'

interface OrderThumbProps {
	imageKey: string | null | undefined
	alt: string
}

export function OrderThumb({ imageKey, alt }: OrderThumbProps) {
	return (
		<div className='flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted'>
			<StoredImage
				imageKey={imageKey}
				alt={alt}
				className='h-full w-full object-cover'
				fallback={<UtensilsCrossed className='size-5 text-muted-foreground' />}
			/>
		</div>
	)
}
