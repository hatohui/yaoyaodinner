import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Cropper, { type Area } from 'react-easy-crop'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getCroppedImageBlob } from '@/utils/cropImage'

interface ImageCropDialogProps {
	imageSrc: string
	aspect: number
	shape?: 'rect' | 'round'
	mimeType: string
	onConfirm: (blob: Blob) => void
	onCancel: () => void
}

export function ImageCropDialog({
	imageSrc,
	aspect,
	shape = 'rect',
	mimeType,
	onConfirm,
	onCancel,
}: ImageCropDialogProps) {
	const { t } = useTranslation()
	const [crop, setCrop] = useState({ x: 0, y: 0 })
	const [zoom, setZoom] = useState(1)
	const [croppedPixels, setCroppedPixels] = useState<Area | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	const onCropComplete = useCallback((_: Area, pixels: Area) => {
		setCroppedPixels(pixels)
	}, [])

	const confirm = async () => {
		if (!croppedPixels) return
		setIsSaving(true)
		try {
			const blob = await getCroppedImageBlob(imageSrc, croppedPixels, mimeType)
			onConfirm(blob)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<Dialog open onOpenChange={open => !open && onCancel()}>
			<DialogContent className='rounded-3xl'>
				<DialogHeader>
					<DialogTitle>{t('common.crop_image')}</DialogTitle>
				</DialogHeader>

				<div className='relative h-72 w-full overflow-hidden rounded-2xl bg-muted'>
					<Cropper
						image={imageSrc}
						crop={crop}
						zoom={zoom}
						aspect={aspect}
						cropShape={shape}
						onCropChange={setCrop}
						onZoomChange={setZoom}
						onCropComplete={onCropComplete}
					/>
				</div>

				<input
					type='range'
					min={1}
					max={3}
					step={0.01}
					value={zoom}
					onChange={e => setZoom(Number(e.target.value))}
					className='w-full accent-primary'
					aria-label={t('common.crop_zoom')}
				/>

				<DialogFooter>
					<Button variant='outline' className='rounded-full' onClick={onCancel}>
						{t('common.cancel')}
					</Button>
					<Button
						className='rounded-full'
						onClick={confirm}
						disabled={!croppedPixels || isSaving}
					>
						{t('common.crop_confirm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
