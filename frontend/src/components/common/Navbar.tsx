import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
	Armchair,
	CircleHelp,
	FlaskConical,
	Info,
	LayoutDashboard,
	MessageSquareHeart,
	ShieldCheck,
	UtensilsCrossed,
} from 'lucide-react'
import { DesktopNav } from './DesktopNav'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSelector } from './LanguageSelector'
import { AdminMenu } from './AdminMenu'
import { IdentityMenu } from './IdentityMenu'
import { AppLogo } from './AppLogo'
import { MobileNav } from './MobileNav'
import { cn } from '@/utils/shadcn'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useConfig } from '@/hooks/useConfig'
import {
	ADMIN_GATE_LOCK_MS,
	ADMIN_GATE_TAPS,
	ADMIN_GATE_WINDOW_MS,
} from '@/common/constants'

export function Navbar() {
	const { t } = useTranslation()
	const { pathname } = useLocation()
	const navigate = useNavigate()
	const { isAdmin } = useIsAdmin()
	const { feedbackWall, menu, tables } = useConfig()
	const tapCount = useRef(0)
	const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const gateOpenedAt = useRef(0)
	const [mobileOpen, setMobileOpen] = useState(false)
	const [pending, setPending] = useState<{ to: string; from: string } | null>(
		null
	)
	const pendingTo = pending?.from === pathname ? pending.to : null

	const handleNavClick = (to: string) => {
		if (!isActive(to)) setPending({ to, from: pathname })
	}

	const handleLogoClick = (e: React.MouseEvent) => {
		if (Date.now() - gateOpenedAt.current < ADMIN_GATE_LOCK_MS) {
			e.preventDefault()
			return
		}

		tapCount.current += 1
		if (tapTimer.current) clearTimeout(tapTimer.current)

		if (tapCount.current >= ADMIN_GATE_TAPS) {
			tapCount.current = 0
			gateOpenedAt.current = Date.now()
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
					<AppLogo className='h-5 w-auto' />
				</Link>

				<DesktopNav
					links={desktopLinks}
					isActive={isActive}
					pendingTo={pendingTo}
					onNavigate={handleNavClick}
				/>

				<div className='flex shrink-0 items-center gap-0.5 sm:gap-1'>
					{isAdmin && (
						<Link
							to='/admin'
							onClick={() => handleNavClick('/admin')}
							aria-label={t('admin.nav.dashboard')}
							title={t('admin.nav.dashboard')}
							className={cn(
								'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
								pathname.startsWith('/admin')
									? 'bg-primary text-primary-foreground shadow-sm'
									: 'text-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-accent/50'
							)}
						>
							<LayoutDashboard className='size-4' />
						</Link>
					)}
					<AdminMenu />
					<div className='hidden items-center gap-1 sm:flex'>
						<LanguageSelector />
						<ThemeToggle />
					</div>
					{!pathname.startsWith('/admin') && <IdentityMenu />}

					<MobileNav
						open={mobileOpen}
						onOpenChange={setMobileOpen}
						links={navLinks}
						isActive={isActive}
						pendingTo={pendingTo}
						onNavigate={handleNavClick}
					/>
				</div>
			</div>
		</header>
	)
}
