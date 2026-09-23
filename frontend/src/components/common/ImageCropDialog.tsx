import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Cropper, { type Area, type MediaSize } from 'react-easy-crop'
import { RotateCcw, RotateCw, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getCroppedImageBlob } from '@/utils/cropImage'
import { cn } from '@/utils/shadcn'

const MIN_ZOOM = 1
const MAX_ZOOM = 4

const ASPECT_PRESETS = [
	{ key: '1:1', value: 1 },
	{ key: '4:3', value: 4 / 3 },
	{ key: '16:9', value: 16 / 9 },
] as const

type AspectChoice = 'original' | (typeof ASPECT_PRESETS)[number]['key']

interface ImageCropDialogProps {
	imageSrc: string
	/** Fixed crop ratio. Omit to let the user pick, defaulting to the image's own ratio. */
	aspect?: number
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
	const [zoom, setZoom] = useState(MIN_ZOOM)
	const [rotation, setRotation] = useState(0)
	const [aspectChoice, setAspectChoice] = useState<AspectChoice>('original')
	const [media, setMedia] = useState<MediaSize | null>(null)
	const [croppedPixels, setCroppedPixels] = useState<Area | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	const onCropComplete = useCallback((_: Area, pixels: Area) => {
		setCroppedPixels(pixels)
	}, [])

	const sideways = rotation % 180 !== 0
	const originalAspect = media
		? sideways
			? media.naturalHeight / media.naturalWidth
			: media.naturalWidth / media.naturalHeight
		: 4 / 3
	const activeAspect =
		aspect ??
		ASPECT_PRESETS.find(p => p.key === aspectChoice)?.value ??
		originalAspect

	const rotate = (delta: number) => {
		setRotation(r => (r + delta + 360) % 360)
		setCrop({ x: 0, y: 0 })
	}

	const reset = () => {
		setCrop({ x: 0, y: 0 })
		setZoom(MIN_ZOOM)
		setRotation(0)
		setAspectChoice('original')
	}

	const confirm = async () => {
		if (!croppedPixels) return
		setIsSaving(true)
		try {
			const blob = await getCroppedImageBlob(
				imageSrc,
				croppedPixels,
				mimeType,
				rotation
			)
			onConfirm(blob)
		} finally {
			setIsSaving(false)
		}
	}

	const toolButton =
		'flex size-9 items-center justify-center rounded-full border border-border bg-control text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary'

	return (
		<Dialog open onOpenChange={open => !open && onCancel()}>
			<DialogContent className='gap-4 rounded-3xl sm:max-w-xl'>
				<DialogHeader>
					<DialogTitle>{t('common.crop_image')}</DialogTitle>
					<DialogDescription>{t('common.crop_hint')}</DialogDescription>
				</DialogHeader>

				<div className='relative h-[min(60vh,24rem)] w-full overflow-hidden rounded-2xl border border-border bg-muted'>
					<Cropper
						image={imageSrc}
						crop={crop}
						zoom={zoom}
						rotation={rotation}
						minZoom={MIN_ZOOM}
						maxZoom={MAX_ZOOM}
						aspect={activeAspect}
						cropShape={shape}
						onCropChange={setCrop}
						onZoomChange={setZoom}
						onCropComplete={onCropComplete}
						onMediaLoaded={setMedia}
					/>
				</div>

				{aspect === undefined && (
					<div
						role='radiogroup'
						aria-label={t('common.crop_aspect')}
						className='flex flex-wrap gap-2'
					>
						{(['original', ...ASPECT_PRESETS.map(p => p.key)] as const).map(
							key => (
								<button
									key={key}
									type='button'
									role='radio'
									aria-checked={aspectChoice === key}
									onClick={() => setAspectChoice(key)}
									className={cn(
										'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
										aspectChoice === key
											? 'bg-primary text-primary-foreground shadow-sm'
											: 'border border-border bg-control text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
									)}
								>
									{key === 'original' ? t('common.crop_aspect_original') : key}
								</button>
							)
						)}
					</div>
				)}

				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 0.25))}
						aria-label={t('common.crop_zoom_out')}
						className={toolButton}
					>
						<ZoomOut className='size-4' />
					</button>
					<input
						type='range'
						min={MIN_ZOOM}
						max={MAX_ZOOM}
						step={0.01}
						value={zoom}
						onChange={e => setZoom(Number(e.target.value))}
						className='h-2 flex-1 cursor-pointer accent-primary'
						aria-label={t('common.crop_zoom')}
					/>
					<button
						type='button'
						onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 0.25))}
						aria-label={t('common.crop_zoom_in')}
						className={toolButton}
					>
						<ZoomIn className='size-4' />
					</button>
					<span className='mx-1 h-6 w-px bg-border' />
					<button
						type='button'
						onClick={() => rotate(-90)}
						aria-label={t('common.crop_rotate_left')}
						className={toolButton}
					>
						<RotateCcw className='size-4' />
					</button>
					<button
						type='button'
						onClick={() => rotate(90)}
						aria-label={t('common.crop_rotate_right')}
						className={toolButton}
					>
						<RotateCw className='size-4' />
					</button>
					<button
						type='button'
						onClick={reset}
						aria-label={t('common.crop_reset')}
						className={toolButton}
					>
						<Undo2 className='size-4' />
					</button>
				</div>

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
