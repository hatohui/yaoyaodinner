import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
	Armchair,
	CircleHelp,
	FlaskConical,
	Info,
	LayoutDashboard,
	Loader2,
	Menu,
	MessageSquareHeart,
	PencilLine,
	ShieldCheck,
	UtensilsCrossed,
} from 'lucide-react'
import { DesktopNav } from './DesktopNav'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSelector } from './LanguageSelector'
import { AdminMenu } from './AdminMenu'
import { IdentityMenu } from './IdentityMenu'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/utils/shadcn'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useEditMode } from '@/hooks/useEditMode'
import { useConfig } from '@/hooks/useConfig'
import { ADMIN_GATE_TAPS, ADMIN_GATE_WINDOW_MS } from '@/common/constants'

export function Navbar() {
	const { t } = useTranslation()
	const { pathname } = useLocation()
	const navigate = useNavigate()
	const { isAdmin } = useIsAdmin()
	const { editing, toggle: toggleEditMode } = useEditMode()
	const { feedbackWall, menu, tables } = useConfig()
	const tapCount = useRef(0)
	const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const [mobileOpen, setMobileOpen] = useState(false)
	const [pending, setPending] = useState<{ to: string; from: string } | null>(
		null
	)
	const pendingTo = pending?.from === pathname ? pending.to : null

	const handleNavClick = (to: string) => {
		if (!isActive(to)) setPending({ to, from: pathname })
	}

	const handleLogoClick = (e: React.MouseEvent) => {
		tapCount.current += 1
		if (tapTimer.current) clearTimeout(tapTimer.current)

		if (tapCount.current >= ADMIN_GATE_TAPS) {
			tapCount.current = 0
			e.preventDefault()
			navigate('/admin')
			return
		}

		tapTimer.current = setTimeout(() => {
			tapCount.current = 0
		}, ADMIN_GATE_WINDOW_MS)
	}

	const navLinks = [
		{ to: '/about', label: t('nav.about'), icon: Info, show: true },
		{
			to: '/menu',
			label: t('nav.menu'),
			icon: UtensilsCrossed,
			show: menu,
		},
		{ to: '/tables', label: t('nav.tables'), icon: Armchair, show: tables },
		{
			to: '/feedback',
			label: t('nav.feedback'),
			icon: MessageSquareHeart,
			show: feedbackWall,
		},
		{ to: '/faq', label: t('nav.faq'), icon: CircleHelp, show: true },
		{
			to: '/dev',
			label: t('nav.dev'),
			icon: FlaskConical,
			show: import.meta.env.DEV,
		},
		{
			to: '/admin',
			label: t('nav.admin'),
			icon: ShieldCheck,
			show: isAdmin,
		},
	].filter(link => link.show)

	const desktopLinks = navLinks.filter(link => link.to !== '/admin')

	const isActive = (to: string) =>
		to === '/admin' || to === '/tables'
			? pathname.startsWith(to)
			: pathname === to

	return (
		<header className='fixed top-0 z-50 w-full border-b border-border bg-card/90 dark:bg-card/75 shadow-sm backdrop-blur-xl'>
			<div className='mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4'>
				<Link
					to='/'
					onClick={handleLogoClick}
					className='flex min-w-0 shrink items-center gap-1.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-70'
				>
					<img
						src='/images/logo.png'
						className='h-5 w-auto object-contain dark:invert'
						alt='Logo'
					/>
				</Link>

				<DesktopNav
					links={desktopLinks}
					isActive={isActive}
					pendingTo={pendingTo}
					onNavigate={handleNavClick}
				/>

				<div className='flex shrink-0 items-center gap-0.5 sm:gap-1'>
					{isAdmin && (
						<>
							<Link
								to='/admin'
								onClick={() => handleNavClick('/admin')}
								aria-label={t('admin.nav.dashboard')}
								title={t('admin.nav.dashboard')}
								className={cn(
									'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
									pathname.startsWith('/admin')
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'text-foreground hover:bg-card/85 hover:text-primary dark:hover:bg-accent/50'
								)}
							>
								<LayoutDashboard className='size-4' />
							</Link>
							<button
								type='button'
								onClick={toggleEditMode}
								aria-label={
									editing ? t('admin.edit_mode.on') : t('admin.edit_mode.label')
								}
								title={
									editing ? t('admin.edit_mode.on') : t('admin.edit_mode.label')
								}
								aria-pressed={editing}
								className={cn(
									'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors',
									editing
										? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40'
										: 'text-foreground hover:bg-card/85 hover:text-primary dark:hover:bg-accent/50'
								)}
							>
								<PencilLine className='size-4' />
							</button>
						</>
					)}
					<AdminMenu />
					<div className='hidden items-center gap-1 sm:flex'>
						<LanguageSelector />
						<ThemeToggle />
					</div>
					{!pathname.startsWith('/admin') && <IdentityMenu />}

					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger asChild>
							<button
								type='button'
								aria-label={t('nav.open_menu')}
								className='flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card/85 hover:text-primary sm:hidden dark:hover:bg-accent/50'
							>
								<Menu className='size-5' />
							</button>
						</SheetTrigger>
						<SheetContent side='right' className='w-64'>
							<SheetHeader>
								<SheetTitle className='flex items-center gap-1.5'>
									<img
										src='/images/logo.png'
										className='h-4 w-auto object-contain dark:invert'
										alt='Logo'
									/>
									{t('menu.restaurant_name')}
								</SheetTitle>
							</SheetHeader>
							<nav className='flex flex-col gap-1 px-4 pb-4'>
								{navLinks.map(link => (
									<Link
										key={link.to}
										to={link.to}
										onClick={() => {
											handleNavClick(link.to)
											setMobileOpen(false)
										}}
										aria-busy={pendingTo === link.to}
										className={cn(
											'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
											isActive(link.to)
												? 'bg-primary/90 text-primary-foreground shadow-sm'
												: 'text-muted-foreground hover:bg-accent hover:text-foreground'
										)}
									>
										{pendingTo === link.to ? (
											<Loader2 className='size-4 animate-spin shrink-0' />
										) : (
											<link.icon className='size-4 shrink-0' />
										)}
										{link.label}
									</Link>
								))}
							</nav>
							<div className='mt-auto flex items-center justify-between gap-2 border-t border-border px-4 py-3'>
								<LanguageSelector />
								<ThemeToggle />
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	)
}
