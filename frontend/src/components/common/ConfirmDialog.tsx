import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/shadcn'
import { buttonVariants } from '@/components/ui/button'

interface ConfirmDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description?: string
	confirmLabel?: string
	destructive?: boolean
	requirePassphrase?: boolean
	onConfirm: (passphrase?: string) => void
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	destructive = true,
	requirePassphrase = false,
	onConfirm,
}: ConfirmDialogProps) {
	const { t } = useTranslation()
	const [passphrase, setPassphrase] = useState('')

	const handleOpenChange = (next: boolean) => {
		if (!next) setPassphrase('')
		onOpenChange(next)
	}

	const handleConfirm = () => {
		const value = passphrase.trim()
		setPassphrase('')
		onConfirm(requirePassphrase ? value : undefined)
	}

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogContent className='rounded-3xl'>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					{description && (
						<AlertDialogDescription>{description}</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				{requirePassphrase && (
					<Input
						type='password'
						value={passphrase}
						onChange={e => setPassphrase(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter' && passphrase.trim()) {
								e.preventDefault()
								handleConfirm()
							}
						}}
						placeholder={t('admin.event.owner_passphrase_placeholder')}
						autoFocus
						className='rounded-full'
					/>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel className='rounded-full'>
						{t('common.cancel')}
					</AlertDialogCancel>
					<AlertDialogAction
						disabled={requirePassphrase && !passphrase.trim()}
						onClick={handleConfirm}
						className={cn(
							'rounded-full',
							destructive && buttonVariants({ variant: 'destructive' })
						)}
					>
						{confirmLabel ?? t('common.confirm')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
