import { useTranslation } from 'react-i18next'
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
	wish: TableWishDto | undefined
	onPick: (kind: WishKind) => void
	onRemove: () => void
}

/** Puts a dish on the table's plan straight from the menu. */
export function WishMenu({ wish, onPick, onRemove }: WishMenuProps) {
	const { t } = useTranslation()
	const current = KINDS.find(k => k.kind === wish?.kind)
	const Icon = current?.icon ?? ListPlus
	const label = current
		? t(`plan_board.${current.kind}`)
		: t('plan_board.add_to_plan')

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					aria-label={label}
					title={label}
					className={cn(
						'flex size-8 cursor-pointer items-center justify-center rounded-full shadow backdrop-blur-sm transition-colors',
						!current && 'bg-card/90 text-foreground hover:text-primary',
						current?.kind === 'avoid' &&
							'bg-destructive text-primary-foreground',
						current &&
							current.kind !== 'avoid' &&
							'bg-primary text-primary-foreground'
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
				{wish && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={onRemove} className='gap-2'>
							<X className='size-4' />
							{t('plan_board.remove_from_plan')}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
