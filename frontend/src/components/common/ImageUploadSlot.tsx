import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Expand, ImagePlus, Loader2, X } from 'lucide-react'
import { useImageUpload } from '@/hooks/useImageUpload'
import { ImageCropDialog } from '@/components/common/ImageCropDialog'
import { ImageViewer } from '@/components/common/ImageViewer'
import { StoredImage } from '@/components/common/StoredImage'
import { cn } from '@/utils/shadcn'

interface ImageUploadSlotProps {
	shape: 'circle' | 'banner'
	folder: string
	imageKey?: string | null
	onChange: (key: string | null) => void
	className?: string
	/** Renders the banner shape as a small pill/thumbnail for optional, low-emphasis uploads. */
	compact?: boolean
	/** Crop aspect ratio for the banner shape */
	aspect?: number
}

export function ImageUploadSlot({
	shape,
	folder,
	imageKey,
	onChange,
	className,
	compact,
	aspect = 3,
}: ImageUploadSlotProps) {
	const { t } = useTranslation()
	const { upload, validate, isUploading } = useImageUpload(folder)
	const inputRef = useRef<HTMLInputElement>(null)
	const [pending, setPending] = useState<{ src: string; type: string } | null>(
		null
	)
	const [viewing, setViewing] = useState(false)

	const src = imageKey || null

	const resetInput = () => {
		if (inputRef.current) inputRef.current.value = ''
	}

	const handleFile = (file: File | undefined) => {
		if (!file) return
		if (!validate(file)) {
			resetInput()
			return
		}
		setPending({ src: URL.createObjectURL(file), type: file.type })
	}

	const closeCrop = () => {
		if (pending) URL.revokeObjectURL(pending.src)
		setPending(null)
		resetInput()
	}

	const confirmCrop = async (blob: Blob) => {
		if (!pending) return
		const cropped = new File([blob], 'image', { type: blob.type })
		closeCrop()
		const key = await upload(cropped)
		if (key) onChange(key)
	}

	if (shape === 'circle') {
		return (
			<div className={cn('group relative shrink-0', className)}>
				<button
					type='button'
					onClick={() => inputRef.current?.click()}
					aria-label={t('common.upload_image')}
					className='relative flex size-10 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted transition-colors hover:border-primary'
				>
					{src ? (
						<StoredImage imageKey={src} className='size-full object-cover' />
					) : (
						<Camera className='size-4 text-muted-foreground' />
					)}
					<div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
						{isUploading ? (
							<Loader2 className='size-4 animate-spin text-white' />
						) : (
							<Camera className='size-4 text-white' />
						)}
					</div>
				</button>
				{src && (
					<button
						type='button'
						onClick={() => onChange(null)}
						aria-label={t('common.remove_image')}
						className='absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow'
					>
						<X className='size-2.5' />
					</button>
				)}
				<input
					ref={inputRef}
					type='file'
					accept='image/*'
					className='hidden'
					onChange={e => handleFile(e.target.files?.[0])}
				/>

				{pending && (
					<ImageCropDialog
						imageSrc={pending.src}
						mimeType={pending.type}
						aspect={1}
						shape='round'
						onConfirm={confirmCrop}
						onCancel={closeCrop}
					/>
				)}
			</div>
		)
	}

	if (compact) {
		return (
			<div className={cn('group relative inline-flex shrink-0', className)}>
				{src ? (
					<button
						type='button'
						onClick={() => inputRef.current?.click()}
						aria-label={t('common.change_image')}
						className='relative size-16 overflow-hidden rounded-xl border border-border/60'
					>
						<StoredImage imageKey={src} className='size-full object-cover' />
						<div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
							{isUploading ? (
								<Loader2 className='size-4 animate-spin text-white' />
							) : (
								<ImagePlus className='size-4 text-white' />
							)}
						</div>
					</button>
				) : (
					<button
						type='button'
						onClick={() => inputRef.current?.click()}
						className='flex items-center gap-1.5 rounded-full border border-dashed border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground'
					>
						{isUploading ? (
							<Loader2 className='size-3.5 animate-spin' />
						) : (
							<ImagePlus className='size-3.5' />
						)}
						{t('common.upload_image')}
					</button>
				)}
				{src && (
					<button
						type='button'
						onClick={() => onChange(null)}
						aria-label={t('common.remove_image')}
						className='absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow'
					>
						<X className='size-2.5' />
					</button>
				)}
				{src && (
					<button
						type='button'
						onClick={() => setViewing(true)}
						aria-label={t('common.view_image')}
						className='absolute -bottom-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-background text-foreground shadow'
					>
						<Expand className='size-3' />
					</button>
				)}
				<input
					ref={inputRef}
					type='file'
					accept='image/*'
					className='hidden'
					onChange={e => handleFile(e.target.files?.[0])}
				/>

				{pending && (
					<ImageCropDialog
						imageSrc={pending.src}
						mimeType={pending.type}
						shape='rect'
						onConfirm={confirmCrop}
						onCancel={closeCrop}
					/>
				)}
				{src && (
					<ImageViewer
						imageKey={src}
						open={viewing}
						onOpenChange={setViewing}
					/>
				)}
			</div>
		)
	}

	return (
		<div
			className={cn(
				'group relative flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-primary/10 transition-colors hover:border-primary hover:bg-primary/15',
				className
			)}
		>
			{src && (
				<StoredImage
					imageKey={src}
					className='absolute inset-0 size-full object-cover'
				/>
			)}
			<button
				type='button'
				onClick={() => inputRef.current?.click()}
				className={cn(
					'relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
					src
						? 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
						: 'text-primary'
				)}
			>
				{isUploading ? (
					<Loader2 className='size-4 animate-spin' />
				) : (
					<ImagePlus className='size-4' />
				)}
				{t(src ? 'common.change_image' : 'common.upload_image')}
			</button>
			{src && (
				<button
					type='button'
					onClick={() => onChange(null)}
					aria-label={t('common.remove_image')}
					className='absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100'
				>
					<X className='size-3.5' />
				</button>
			)}
			{src && (
				<button
					type='button'
					onClick={() => setViewing(true)}
					aria-label={t('common.view_image')}
					className='absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white transition-opacity sm:opacity-0 sm:group-hover:opacity-100'
				>
					<Expand className='size-3.5' />
				</button>
			)}
			<input
				ref={inputRef}
				type='file'
				accept='image/*'
				className='hidden'
				onChange={e => handleFile(e.target.files?.[0])}
			/>

			{pending && (
				<ImageCropDialog
					imageSrc={pending.src}
					mimeType={pending.type}
					aspect={aspect}
					shape='rect'
					onConfirm={confirmCrop}
					onCancel={closeCrop}
				/>
			)}
			{src && (
				<ImageViewer imageKey={src} open={viewing} onOpenChange={setViewing} />
			)}
		</div>
	)
}
