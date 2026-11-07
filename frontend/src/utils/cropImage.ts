import {
	IMAGE_MAX_SIZE_PX,
	IMAGE_QUALITY,
	THUMBNAIL_MAX_SIZE_PX,
	THUMBNAIL_QUALITY,
} from '@/common/constants'

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
	rotation = 0,
	maxSize = IMAGE_MAX_SIZE_PX
): Promise<Blob> {
	const image = await loadImage(imageSrc)

	// react-easy-crop reports the crop relative to the rotated bounding box
	const bounds = rotatedSize(image.width, image.height, rotation)
	const scale = Math.min(1, maxSize / Math.max(crop.width, crop.height))

	const canvas = document.createElement('canvas')
	canvas.width = Math.max(1, Math.round(crop.width * scale))
	canvas.height = Math.max(1, Math.round(crop.height * scale))
	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('Canvas not supported')

	ctx.imageSmoothingQuality = 'high'
	ctx.scale(scale, scale)
	ctx.translate(bounds.width / 2 - crop.x, bounds.height / 2 - crop.y)
	ctx.rotate((rotation * Math.PI) / 180)
	ctx.drawImage(image, -image.width / 2, -image.height / 2)

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			blob => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
			'image/webp',
			IMAGE_QUALITY
		)
	})
}

export async function compressImage(
	source: Blob,
	maxSize = IMAGE_MAX_SIZE_PX,
	quality = IMAGE_QUALITY
): Promise<Blob> {
	const src = URL.createObjectURL(source)
	try {
		const image = await loadImage(src)
		const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
		const canvas = document.createElement('canvas')
		canvas.width = Math.max(1, Math.round(image.width * scale))
		canvas.height = Math.max(1, Math.round(image.height * scale))
		const ctx = canvas.getContext('2d')
		if (!ctx) throw new Error('Canvas not supported')
		ctx.imageSmoothingQuality = 'high'
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

		// Browsers without WebP encoding fall back to PNG, which keeps transparency
		return await new Promise((resolve, reject) => {
			canvas.toBlob(
				blob => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
				'image/webp',
				quality
			)
		})
	} finally {
		URL.revokeObjectURL(src)
	}
}

export async function createThumbnail(
	source: Blob,
	maxSize = THUMBNAIL_MAX_SIZE_PX
): Promise<Blob> {
	return compressImage(source, maxSize, THUMBNAIL_QUALITY)
}
