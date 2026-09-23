import { THUMBNAIL_MAX_SIZE_PX, THUMBNAIL_QUALITY } from '@/common/constants'

export interface CropPixels {
	x: number
	y: number
	width: number
	height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.addEventListener('load', () => resolve(img))
		img.addEventListener('error', reject)
		img.src = src
	})
}

function rotatedSize(width: number, height: number, rotation: number) {
	const rad = (rotation * Math.PI) / 180
	return {
		width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
		height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
	}
}

export async function getCroppedImageBlob(
	imageSrc: string,
	crop: CropPixels,
	mimeType = 'image/jpeg',
	rotation = 0
): Promise<Blob> {
	const image = await loadImage(imageSrc)

	// react-easy-crop reports the crop relative to the rotated bounding box
	const bounds = rotatedSize(image.width, image.height, rotation)
	const rotated = document.createElement('canvas')
	rotated.width = bounds.width
	rotated.height = bounds.height
	const rotatedCtx = rotated.getContext('2d')
	if (!rotatedCtx) throw new Error('Canvas not supported')
	rotatedCtx.translate(bounds.width / 2, bounds.height / 2)
	rotatedCtx.rotate((rotation * Math.PI) / 180)
	rotatedCtx.drawImage(image, -image.width / 2, -image.height / 2)

	const canvas = document.createElement('canvas')
	canvas.width = crop.width
	canvas.height = crop.height
	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('Canvas not supported')
	ctx.drawImage(
		rotated,
		crop.x,
		crop.y,
		crop.width,
		crop.height,
		0,
		0,
		crop.width,
		crop.height
	)

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			blob => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
			mimeType,
			0.92
		)
	})
}

export async function createThumbnail(
	source: Blob,
	maxSize = THUMBNAIL_MAX_SIZE_PX
): Promise<Blob> {
	const src = URL.createObjectURL(source)
	try {
		const image = await loadImage(src)
		const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
		const canvas = document.createElement('canvas')
		canvas.width = Math.round(image.width * scale)
		canvas.height = Math.round(image.height * scale)
		const ctx = canvas.getContext('2d')
		if (!ctx) throw new Error('Canvas not supported')
		ctx.imageSmoothingQuality = 'high'
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

		// Browsers without WebP encoding fall back to PNG, which keeps transparency
		return await new Promise((resolve, reject) => {
			canvas.toBlob(
				blob => (blob ? resolve(blob) : reject(new Error('Thumbnail failed'))),
				'image/webp',
				THUMBNAIL_QUALITY
			)
		})
	} finally {
		URL.revokeObjectURL(src)
	}
}
