import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ImageUploadSlot } from '@/components/common/ImageUploadSlot'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'

interface ClownifyDialogProps {
	pending: boolean
	onClownify: (imageKey: string) => Promise<unknown>
}

export function ClownifyDialog({ pending, onClownify }: ClownifyDialogProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const [imageKey, setImageKey] = useState<string | null>(null)
	const [failed, setFailed] = useState(false)

	const run = async (key: string) => {
		setFailed(false)
		try {
			await onClownify(key)
			setOpen(false)
			setImageKey(null)
		} catch {
			setFailed(true)
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={next => {
				if (pending) return
				setOpen(next)
				if (!next) {
					setImageKey(null)
					setFailed(false)
				}
			}}
		>
			<DialogTrigger asChild>
				<Button
					size='sm'
					variant='outline'
					className='group gap-1.5 rounded-full border-2 border-dashed border-primary/60 font-semibold text-primary transition-transform hover:-rotate-3 hover:scale-105 hover:bg-primary/10'
				>
					<span
						aria-hidden
						className='inline-block text-base leading-none group-hover:animate-bounce'
					>
						{t('admin.food.clownify.emoji')}
					</span>
					{t('admin.food.clownify.button')}
				</Button>
			</DialogTrigger>
			<DialogContent className='rounded-3xl'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<span aria-hidden>{t('admin.food.clownify.emoji')}</span>
						{t('admin.food.clownify.title')}
					</DialogTitle>
					<DialogDescription>
						{t('admin.food.clownify.description')}
					</DialogDescription>
				</DialogHeader>

				<ImageUploadSlot
					shape='banner'
					folder='foods'
					aspect={4 / 3}
					imageKey={imageKey}
					onChange={key => {
						setImageKey(key)
						if (key) void run(key)
					}}
				/>

				{pending && (
					<p className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
						<Spinner />
						{t('admin.food.clownify.working')}
					</p>
				)}
				{failed && !pending && (
					<p className='text-center text-sm text-destructive'>
						{t('admin.food.clownify.failed')}
					</p>
				)}

				{failed && imageKey && (
					<DialogFooter>
						<Button
							className='gap-1.5 rounded-full'
							disabled={pending}
							onClick={() => void run(imageKey)}
						>
							<RefreshCw />
							{t('admin.food.clownify.retry')}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	)
}
