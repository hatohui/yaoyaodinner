import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { LayoutDashboard, Lock, PencilLine, ShieldCheck } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdmin } from '@/hooks/useAdmin'
import { useEditMode } from '@/hooks/useEditMode'
import { cn } from '@/utils/shadcn'

export function AdminMenu() {
	const { t } = useTranslation()
	const { isAdmin, editing, toggle } = useEditMode()
	const lock = useAdmin(s => s.clear)

	if (!isAdmin) return null

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					aria-label={t('admin.nav.title')}
					title={editing ? t('admin.edit_mode.on') : t('admin.nav.title')}
					className={cn(
						'flex size-8 shrink-0 items-center justify-center rounded-full ring-1 transition-colors',
						editing
							? 'bg-primary text-primary-foreground shadow-sm ring-primary'
							: 'bg-primary/15 text-primary ring-primary/40 hover:bg-primary/25'
					)}
				>
					{editing ? (
						<PencilLine className='size-4' />
					) : (
						<ShieldCheck className='size-4' />
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='min-w-48'>
				<DropdownMenuLabel className='font-normal text-muted-foreground'>
					{t('admin.nav.title')}
				</DropdownMenuLabel>
				<DropdownMenuCheckboxItem
					checked={editing}
					onCheckedChange={toggle}
					onSelect={e => e.preventDefault()}
				>
					<PencilLine />
					{t('admin.edit_mode.label')}
				</DropdownMenuCheckboxItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link to='/admin'>
						<LayoutDashboard />
						{t('admin.nav.dashboard')}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem variant='destructive' onSelect={lock}>
					<Lock />
					{t('admin.nav.lock')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
