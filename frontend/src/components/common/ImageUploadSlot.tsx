import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, ImagePlus, Loader2, X } from 'lucide-react'
import { ASSET_URL } from '@/common/app'
import { useImageUpload } from '@/hooks/useImageUpload'
import { ImageCropDialog } from '@/components/common/ImageCropDialog'
import { cn } from '@/utils/shadcn'

interface ImageUploadSlotProps {
	shape: 'circle' | 'banner'
	folder: string
	imageKey?: string | null
	onChange: (key: string | null) => void
	className?: string
}

export function ImageUploadSlot({
	shape,
	folder,
	imageKey,
	onChange,
	className,
}: ImageUploadSlotProps) {
	const { t } = useTranslation()
	const { upload, validate, isUploading } = useImageUpload(folder)
	const inputRef = useRef<HTMLInputElement>(null)
	const [pending, setPending] = useState<{ src: string; type: string } | null>(
		null
	)

	const src = imageKey ? `${ASSET_URL}/${imageKey}` : null

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
		const cropped = new File([blob], 'image', { type: pending.type })
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
						<img
							src={src}
							alt=''
							className='size-full object-cover'
						/>
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

	return (
		<div
			className={cn(
				'group relative flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/60 bg-muted transition-colors hover:border-primary',
				className
			)}
		>
			{src && (
				<img
					src={src}
					alt=''
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
						: 'text-muted-foreground'
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
					aspect={3}
					shape='rect'
					onConfirm={confirmCrop}
					onCancel={closeCrop}
				/>
			)}
		</div>
	)
}
