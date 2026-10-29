import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PinInput } from '@/components/common/PinInput'
import { UnlockLayout } from '@/components/common/UnlockLayout'
import { usePinUnlock } from '@/hooks/usePinUnlock'
import { useConfig } from '@/hooks/useConfig'

export function PinUnlock() {
	const { t } = useTranslation()
	const { pinLength } = useConfig()
	const { pin, onChange, submit, invalid, isPending } = usePinUnlock()

	return (
		<UnlockLayout
			icon={Lock}
			title={t('access.enter_pin')}
			subtitle={t('access.subtitle')}
		>
			<PinInput
				value={pin}
				onChange={onChange}
				length={pinLength}
				invalid={invalid}
				autoFocus
				onComplete={submit}
			/>

			{invalid && (
				<p className='text-sm font-medium text-destructive'>
					{t('access.invalid_pin')}
				</p>
			)}

			<Button
				size='lg'
				className='w-full rounded-full'
				disabled={pin.length < pinLength || isPending}
				onClick={() => submit(pin)}
			>
				{isPending ? t('access.unlocking') : t('access.unlock')}
			</Button>

			<p className='text-xs text-muted-foreground'>{t('access.saved_note')}</p>
		</UnlockLayout>
	)
}
