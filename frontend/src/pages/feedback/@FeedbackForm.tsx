import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MarkdownEditor } from '@/components/common/MarkdownEditor'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import { useGuest } from '@/hooks/useGuest'

interface FeedbackFormProps {
	onPost: (by: string, content: string, imageUrl: string | null) => void
	isPosting: boolean
}

export function FeedbackForm({ onPost, isPosting }: FeedbackFormProps) {
	const { t } = useTranslation()
	const guestName = useGuest(s => s.name)
	const [by, setBy] = useState(guestName ?? '')
	const [content, setContent] = useState('')
	const [imageUrl, setImageUrl] = useState<string | null>(null)

	const submit = () => {
		if (!content.trim()) return
		onPost(by, content, imageUrl)
		setContent('')
		setImageUrl(null)
	}

	return (
		<div className='flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm'>
			<Input
				value={by}
				onChange={e => setBy(e.target.value)}
				placeholder={t('feedback.name_placeholder')}
				className='rounded-full'
			/>
			<MarkdownEditor
				value={content}
				onChange={setContent}
				placeholder={t('feedback.content_placeholder')}
			/>
			<div className='flex items-center justify-between gap-2'>
				<ImageUploadSlot
					shape='banner'
					folder='feedback-images'
					imageKey={imageUrl}
					onChange={setImageUrl}
					compact
				/>
				<Button
					className='w-fit shrink-0 gap-1.5 rounded-full'
					disabled={!content.trim() || isPosting}
					onClick={submit}
				>
					<Send className='size-4' />
					{t('feedback.post')}
				</Button>
			</div>
		</div>
	)
}
