import type { LucideIcon } from 'lucide-react'
import { ChevronRight, Loader2, Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/utils/shadcn'
import { LanguageSelector } from './LanguageSelector'
import { ThemeToggle } from './ThemeToggle'
import { MobileQuickActions } from './MobileQuickActions'

interface MobileNavLink {
	to: string
	label: string
	icon: LucideIcon
}

interface MobileNavProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	links: MobileNavLink[]
	isActive: (to: string) => boolean
	pendingTo: string | null
	onNavigate: (to: string) => void
}

export function MobileNav({
	open,
	onOpenChange,
	links,
	isActive,
	pendingTo,
	onNavigate,
}: MobileNavProps) {
	const { t } = useTranslation()

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetTrigger asChild>
				<button
					type='button'
					aria-label={t('nav.open_menu')}
					className='flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary/10 hover:text-primary lg:hidden dark:hover:bg-accent/50'
				>
					<Menu className='size-5' />
				</button>
			</SheetTrigger>
			<SheetContent side='right' className='w-80 gap-0 border-l border-border'>
				<SheetHeader className='gap-0 p-0 pt-12'>
					<SheetTitle className='sr-only'>
						{t('menu.restaurant_name')}
					</SheetTitle>
					<SheetDescription className='sr-only'>
						{t('menu.restaurant_en')} · {t('menu.restaurant_location')}
					</SheetDescription>
					<MobileQuickActions
						onNavigate={to => {
							onNavigate(to)
							onOpenChange(false)
						}}
					/>
				</SheetHeader>

				<div className='mx-4 mt-3 flex items-center justify-between rounded-2xl border border-border bg-muted/50 p-1.5'>
					<LanguageSelector />
					<ThemeToggle />
				</div>

				<nav className='flex flex-col gap-1.5 px-4 pb-6 pt-4'>
					{links.map(link => {
						const active = isActive(link.to)
						return (
							<Link
								key={link.to}
								to={link.to}
								onClick={() => {
									onNavigate(link.to)
									onOpenChange(false)
								}}
								aria-busy={pendingTo === link.to}
								className={cn(
									'group flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors',
									active
										? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
										: 'border-transparent text-foreground hover:border-border hover:bg-accent'
								)}
							>
								<span
									className={cn(
										'flex size-8 shrink-0 items-center justify-center rounded-xl',
										active
											? 'bg-primary-foreground/20'
											: 'bg-primary/10 text-primary'
									)}
								>
									{pendingTo === link.to ? (
										<Loader2 className='size-4 animate-spin' />
									) : (
										<link.icon className='size-4' />
									)}
								</span>
								<span className='flex-1'>{link.label}</span>
								<ChevronRight
									className={cn(
										'size-4 shrink-0 transition-transform group-hover:translate-x-0.5',
										active ? 'opacity-80' : 'text-muted-foreground'
									)}
								/>
							</Link>
						)
					})}
				</nav>
			</SheetContent>
		</Sheet>
	)
}
