import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Expand } from 'lucide-react'
import { StoredImage } from '@/components/common/StoredImage'
import { ImageViewer } from '@/components/common/ImageViewer'
import { cn } from '@/utils/shadcn'

interface ViewableImageProps {
	imageKey: string | null | undefined
	alt?: string
	className?: string
	imgClassName?: string
	fallback?: ReactNode
}

/** Shows the thumbnail; clicking it (or the expand icon) opens the original in a viewer. */
export function ViewableImage({
	imageKey,
	alt = '',
	className,
	imgClassName,
	fallback = null,
}: ViewableImageProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const [failedKey, setFailedKey] = useState<string | null>(null)

	if (!imageKey || failedKey === imageKey) return <>{fallback}</>

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				aria-label={t('common.view_image')}
				className={cn('group relative block cursor-zoom-in', className)}
			>
				<StoredImage
					imageKey={imageKey}
					alt={alt}
					className={imgClassName}
					onFail={() => setFailedKey(imageKey)}
				/>
				<span className='absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white transition-opacity sm:opacity-0 sm:group-hover:opacity-100'>
					<Expand className='size-4' />
				</span>
			</button>
			<ImageViewer
				imageKey={imageKey}
				alt={alt}
				open={open}
				onOpenChange={setOpen}
			/>
		</>
	)
}
