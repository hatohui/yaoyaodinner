import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

interface BackButtonProps {
	to?: string
	label?: string
}

export const BackButton = ({ to, label }: BackButtonProps) => {
	const navigate = useNavigate()
	const { t } = useTranslation()

	const handleClick = () => {
		if (to) {
			navigate(to)
		} else {
			navigate(-1)
		}
	}

	return (
		<Button
			variant='ghost'
			size='sm'
			onClick={handleClick}
			className='text-foreground'
		>
			<ArrowLeft className='mr-2 h-4 w-4' />
			{label || t('common.back')}
		</Button>
	)
}
