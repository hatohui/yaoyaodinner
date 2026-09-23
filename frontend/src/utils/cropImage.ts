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

export async function getCroppedImageBlob(
	imageSrc: string,
	crop: CropPixels,
	mimeType = 'image/jpeg'
): Promise<Blob> {
	const image = await loadImage(imageSrc)
	const canvas = document.createElement('canvas')
	canvas.width = crop.width
	canvas.height = crop.height

	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('Canvas not supported')

	ctx.drawImage(
		image,
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
