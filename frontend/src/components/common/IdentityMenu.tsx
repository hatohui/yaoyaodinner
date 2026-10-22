import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Armchair, ChevronDown, LogOut } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StoredImage } from '@/components/common/StoredImage'
import { useGuest } from '@/hooks/useGuest'
import { useHeldTableCode } from '@/hooks/useTableCode'
import { useToast } from '@/hooks/useToast'

export function IdentityMenu() {
	const { t } = useTranslation()
	const toast = useToast()
	const me = useGuest(s => s.me)
	const clearMe = useGuest(s => s.clearMe)
	const held = useHeldTableCode(s => s.held)
	const release = useHeldTableCode(s => s.release)

	if (!me) return null

	const logOut = () => {
		clearMe()
		if (held?.tableId === me.tableId) release()
		toast.success(t('identity.logged_out'))
	}

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					className='flex items-center gap-1.5 rounded-full border border-border bg-control py-0.5 pl-0.5 pr-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10'
				>
					<span className='flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-secondary-foreground'>
						<StoredImage
							imageKey={me.pfpUrl}
							className='size-full object-cover'
							fallback={me.name.charAt(0).toUpperCase()}
						/>
					</span>
					<span className='max-w-24 truncate sm:max-w-32'>{me.name}</span>
					<ChevronDown className='size-3.5 shrink-0 text-muted-foreground' />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='min-w-48'>
				<DropdownMenuLabel className='font-normal text-muted-foreground'>
					{t('identity.signed_in_as', { name: me.name })}
				</DropdownMenuLabel>
				{me.tableId && (
					<DropdownMenuItem asChild>
						<Link to={`/tables/${me.tableId}`}>
							<Armchair />
							{t('identity.my_table')}
						</Link>
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem variant='destructive' onSelect={logOut}>
					<LogOut />
					{t('identity.log_out')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
