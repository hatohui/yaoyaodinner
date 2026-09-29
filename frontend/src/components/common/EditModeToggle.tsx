import { useTranslation } from 'react-i18next'
import { PencilLine } from 'lucide-react'
import { useEditMode } from '@/hooks/useEditMode'
import { cn } from '@/utils/shadcn'

export function EditModeToggle({ className }: { className?: string }) {
	const { t } = useTranslation()
	const { isAdmin, editing, toggle } = useEditMode()

	if (!isAdmin) return null

	return (
		<button
			type='button'
			onClick={toggle}
			aria-pressed={editing}
			title={t('admin.edit_mode.label')}
			className={cn(
				'inline-flex items-center gap-1.5 rounded-full border p-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-3 sm:py-1.5',
				editing
					? 'border-primary bg-primary text-primary-foreground'
					: 'border-border/60 text-muted-foreground hover:text-foreground',
				className
			)}
		>
			<PencilLine className='size-3.5' />
			<span className='sr-only sm:not-sr-only'>
				{editing ? t('admin.edit_mode.on') : t('admin.edit_mode.label')}
			</span>
		</button>
	)
}
