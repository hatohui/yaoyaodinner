import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Loader2 } from 'lucide-react'
import { useImageUpload } from '@/hooks/useImageUpload'
import { ImageCropDialog } from '@/components/common/ImageCropDialog'
import { cn } from '@/utils/shadcn'

interface FoodImageButtonProps {
	onChange: (key: string) => void
	className?: string
}

export function FoodImageButton({ onChange, className }: FoodImageButtonProps) {
	const { t } = useTranslation()
	const { upload, validate, isUploading } = useImageUpload('foods')
	const inputRef = useRef<HTMLInputElement>(null)
	const [pending, setPending] = useState<{ src: string; type: string } | null>(
		null
	)

	const close = () => {
		if (pending) URL.revokeObjectURL(pending.src)
		setPending(null)
		if (inputRef.current) inputRef.current.value = ''
	}

	const handleFile = (file: File | undefined) => {
		if (!file || !validate(file)) return close()
		setPending({ src: URL.createObjectURL(file), type: file.type })
	}

	const confirm = async (blob: Blob) => {
		close()
		const key = await upload(new File([blob], 'image', { type: blob.type }))
		if (key) onChange(key)
	}

	return (
		<>
			<button
				type='button'
				aria-label={t('common.change_image')}
				title={t('common.change_image')}
				disabled={isUploading}
				onClick={() => inputRef.current?.click()}
				className={cn(
					'flex size-12 items-center justify-center rounded-full bg-card/90 text-primary shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground',
					className,
					isUploading && 'opacity-100'
				)}
			>
				{isUploading ? (
					<Loader2 className='size-5 animate-spin' />
				) : (
					<ImagePlus className='size-5' />
				)}
			</button>
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
					aspect={4 / 3}
					onConfirm={confirm}
					onCancel={close}
				/>
			)}
		</>
	)
}
