import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

interface NeedsMenuTooltipProps {
	active: boolean
	children: ReactNode
}

export function NeedsMenuTooltip({ active, children }: NeedsMenuTooltipProps) {
	const { t } = useTranslation()
	if (!active) return <>{children}</>

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span tabIndex={0} className='block w-full'>
					{children}
				</span>
			</TooltipTrigger>
			<TooltipContent>{t('admin.ordering.needs_menu')}</TooltipContent>
		</Tooltip>
	)
}
