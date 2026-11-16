import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Ban, ListPlus, Sparkles, Star, X } from 'lucide-react'
import type { TableWishDto, WishKind } from '@/api/model'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/shadcn'

const KINDS: { kind: WishKind; icon: typeof Star }[] = [
	{ kind: 'must', icon: Star },
	{ kind: 'want', icon: Sparkles },
	{ kind: 'avoid', icon: Ban },
]

interface WishMenuProps {
	name: string
	wish: TableWishDto | undefined
	onPick: (kind: WishKind) => void
	onRemove: () => void
}

const TRIGGER =
	'flex size-8 cursor-pointer items-center justify-center rounded-full shadow backdrop-blur-sm transition-colors'

/** One tap puts a dish on the plan as "want"; once there, tap again to move or drop it. */
export function WishMenu({ name, wish, onPick, onRemove }: WishMenuProps) {
	const { t } = useTranslation()
	const current = KINDS.find(k => k.kind === wish?.kind)

	if (!current) {
		const quickAdd = () => {
			onPick('want')
			toast.success(
				t('plan_board.quick_added', { name, list: t('plan_board.want') }),
				{
					action: {
						label: t('plan_board.must'),
						onClick: () => onPick('must'),
					},
				}
			)
		}
		return (
			<button
				type='button'
				onClick={quickAdd}
				aria-label={t('plan_board.add_to_plan')}
				title={t('plan_board.add_to_plan')}
				className={cn(TRIGGER, 'bg-card/90 text-foreground hover:text-primary')}
			>
				<ListPlus className='size-4' />
			</button>
		)
	}

	const Icon = current.icon
	const label = t(`plan_board.${current.kind}`)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					aria-label={label}
					title={label}
					className={cn(
						TRIGGER,
						current.kind === 'avoid'
							? 'bg-destructive text-primary-foreground'
							: 'bg-primary text-primary-foreground'
					)}
				>
					<Icon className='size-4' />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-48'>
				<DropdownMenuLabel>{t('plan_board.add_to_plan')}</DropdownMenuLabel>
				{KINDS.map(({ kind, icon: KindIcon }) => (
					<DropdownMenuItem
						key={kind}
						disabled={wish?.kind === kind}
						onSelect={() => onPick(kind)}
						className='gap-2'
					>
						<KindIcon
							className={cn(
								'size-4',
								kind === 'avoid' ? 'text-destructive' : 'text-primary'
							)}
						/>
						{t(`plan_board.${kind}`)}
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={onRemove} className='gap-2'>
					<X className='size-4' />
					{t('plan_board.remove_from_plan')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
