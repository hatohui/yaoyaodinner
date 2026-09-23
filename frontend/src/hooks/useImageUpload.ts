import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getSignedUrl } from '@/api/images/images'
import { useToast } from '@/hooks/useToast'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/common/constants'

export function useImageUpload(folder: string) {
	const { t } = useTranslation()
	const toast = useToast()
	const [isUploading, setIsUploading] = useState(false)

	const validate = (file: File): boolean => {
		if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
			toast.error(t('common.invalid_file_type'))
			return false
		}
		if (file.size > MAX_IMAGE_SIZE_BYTES) {
			toast.error(t('common.file_too_large'))
			return false
		}
		return true
	}

	const upload = async (file: File): Promise<string | null> => {
		if (!validate(file)) return null
		setIsUploading(true)
		try {
			const { url, key } = await getSignedUrl({ folder })
			const res = await fetch(url, {
				method: 'PUT',
				body: file,
				headers: { 'Content-Type': file.type },
			})
			if (!res.ok) throw new Error('Upload failed')
			return key
		} catch {
			toast.error(t('common.upload_failed'))
			return null
		} finally {
			setIsUploading(false)
		}
	}

	return { upload, validate, isUploading }
}
