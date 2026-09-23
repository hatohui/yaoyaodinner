import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Loader2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { StoredImage } from '@/components/common/StoredImage'
import { fullImageUrl } from '@/utils/image'
import { cn } from '@/utils/shadcn'

interface ImageViewerProps {
	imageKey: string
	alt?: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function ImageViewer({
	imageKey,
	alt = '',
	open,
	onOpenChange,
}: ImageViewerProps) {
	const { t } = useTranslation()
	const [loadedKey, setLoadedKey] = useState<string | null>(null)
	const loaded = loadedKey === imageKey

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className='flex max-h-[90vh] w-auto max-w-[95vw] items-center justify-center border-0 bg-transparent p-0 shadow-none sm:max-w-[90vw]'
				onClick={() => onOpenChange(false)}
			>
				<DialogTitle className='sr-only'>
					{alt || t('common.view_image')}
				</DialogTitle>
				<div className='relative' onClick={e => e.stopPropagation()}>
					{!loaded && (
						<StoredImage
							imageKey={imageKey}
							loading='eager'
							aria-hidden
							className='max-h-[90vh] max-w-[95vw] rounded-2xl object-contain blur-sm sm:max-w-[90vw]'
						/>
					)}
					<img
						src={fullImageUrl(imageKey)}
						alt={alt}
						onLoad={() => setLoadedKey(imageKey)}
						className={cn(
							'max-h-[90vh] max-w-[95vw] rounded-2xl object-contain sm:max-w-[90vw]',
							!loaded && 'absolute inset-0 size-full opacity-0'
						)}
					/>
					{!loaded && (
						<div className='absolute inset-0 flex items-center justify-center'>
							<Loader2 className='size-6 animate-spin text-white' />
						</div>
					)}
					<DialogPrimitive.Close
						aria-label={t('common.close')}
						className='absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70'
					>
						<X className='size-4' />
					</DialogPrimitive.Close>
				</div>
			</DialogContent>
		</Dialog>
	)
}
