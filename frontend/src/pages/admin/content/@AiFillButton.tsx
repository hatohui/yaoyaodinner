import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface AiFillButtonProps {
	label: string
	pending?: boolean
	disabled?: boolean
	onClick: () => void
	size?: 'sm' | 'default'
	variant?: 'outline' | 'default'
}

export function AiFillButton({
	label,
	pending = false,
	disabled,
	onClick,
	size = 'sm',
	variant = 'outline',
}: AiFillButtonProps) {
	return (
		<Button
			type='button'
			size={size}
			variant={variant}
			className='gap-1.5 rounded-full'
			disabled={pending || disabled}
			onClick={onClick}
		>
			{pending ? <Spinner className='size-3.5' /> : <Sparkles />}
			{label}
		</Button>
	)
}
