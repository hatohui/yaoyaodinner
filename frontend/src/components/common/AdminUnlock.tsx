import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UnlockLayout } from '@/components/common/UnlockLayout'
import { useAdminUnlock } from '@/hooks/useAdminUnlock'

export function AdminUnlock() {
	const { t } = useTranslation()
	const { passphrase, onChange, submit, invalid, isPending } = useAdminUnlock()

	return (
		<UnlockLayout
			icon={ShieldCheck}
			title={t('admin.gate.title')}
			subtitle={t('admin.gate.subtitle')}
		>
			<form
				onSubmit={e => {
					e.preventDefault()
					submit()
				}}
				className='flex w-full flex-col items-center gap-6'
			>
				<Input
					type='password'
					value={passphrase}
					onChange={e => onChange(e.target.value)}
					placeholder={t('admin.gate.placeholder')}
					autoFocus
					className='h-11 rounded-full border-2 border-input bg-control text-center'
				/>

				{invalid && (
					<p className='text-sm font-medium text-destructive'>
						{t('admin.gate.invalid')}
					</p>
				)}

				<Button
					type='submit'
					size='lg'
					className='w-full rounded-full'
					disabled={!passphrase || isPending}
				>
					{isPending ? t('admin.gate.unlocking') : t('admin.gate.unlock')}
				</Button>
			</form>
		</UnlockLayout>
	)
}
