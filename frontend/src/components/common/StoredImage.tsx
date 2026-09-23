import { useState, type ImgHTMLAttributes, type ReactNode } from 'react'
import { fullImageUrl, thumbImageUrl } from '@/utils/image'

type Stage = 'thumb' | 'full' | 'failed'

interface StoredImageProps
	extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
	imageKey: string | null | undefined
	/** Load the original instead of the thumbnail */
	full?: boolean
	fallback?: ReactNode
	onFail?: () => void
}

/** Renders a stored image by key, falling back from thumbnail to original for uploads that predate thumbnails. */
export function StoredImage({
	imageKey,
	full = false,
	fallback = null,
	onFail,
	alt = '',
	...props
}: StoredImageProps) {
	const initial: Stage = full ? 'full' : 'thumb'
	const [state, setState] = useState<{ key: typeof imageKey; stage: Stage }>({
		key: imageKey,
		stage: initial,
	})
	const stage = state.key === imageKey ? state.stage : initial

	if (!imageKey || stage === 'failed') return <>{fallback}</>

	const thumb = thumbImageUrl(imageKey)
	const original = fullImageUrl(imageKey)

	const handleError = () => {
		const next = stage === 'thumb' && thumb !== original ? 'full' : 'failed'
		setState({ key: imageKey, stage: next })
		if (next === 'failed') onFail?.()
	}

	return (
		<img
			loading='lazy'
			decoding='async'
			{...props}
			alt={alt}
			src={stage === 'thumb' ? thumb : original}
			onError={handleError}
		/>
	)
}
