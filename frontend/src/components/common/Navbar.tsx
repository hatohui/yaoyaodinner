import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { FlaskConical, Menu, PawPrint, ShieldCheck } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSelector } from './LanguageSelector'
import { EditModeToggle } from './EditModeToggle'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/utils/shadcn'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useConfig } from '@/hooks/useConfig'
import { ADMIN_GATE_TAPS, ADMIN_GATE_WINDOW_MS } from '@/common/constants'

export function Navbar() {
	const { t } = useTranslation()
	const { pathname } = useLocation()
	const navigate = useNavigate()
	const { isAdmin } = useIsAdmin()
	const { feedbackWall, ordering, tables } = useConfig()
	const tapCount = useRef(0)
	const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const [mobileOpen, setMobileOpen] = useState(false)

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
		{ to: '/about', label: t('nav.about'), show: true },
		{ to: '/menu', label: t('nav.menu'), show: ordering },
		{ to: '/tables', label: t('nav.tables'), show: tables },
		{ to: '/feedback', label: t('nav.feedback'), show: feedbackWall },
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

	const isActive = (to: string) =>
		to === '/admin' || to === '/tables'
			? pathname.startsWith(to)
			: pathname === to

	return (
		<header 
			className='fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 shadow-sm backdrop-blur-xl'
			style={{
				backgroundImage: 'radial-gradient(circle, var(--bg-dot) 1px, transparent 0)',
				backgroundSize: '28px 28px'
			}}
		>
			<div className='mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4'>
				<Link
					to='/'
					onClick={handleLogoClick}
					className='flex min-w-0 shrink items-center gap-1.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-70'
				>
					<img src='/images/logo.png' className='h-5 w-auto object-contain dark:invert' alt='Logo' />
				</Link>

				<nav className='hidden min-w-0 items-center gap-0.5 sm:flex sm:gap-1'>
					{navLinks.map(link => (
						<Link
							key={link.to}
							to={link.to}
							className={cn(
								'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all sm:px-4',
								isActive(link.to)
									? 'bg-primary/90 text-primary-foreground shadow-sm'
									: 'text-muted-foreground hover:bg-accent hover:text-foreground'
							)}
						>
							{link.icon && <link.icon className='size-3.5' />}
							{link.label}
						</Link>
					))}
				</nav>

				<div className='flex shrink-0 items-center gap-0.5 sm:gap-1'>
					{!pathname.startsWith('/admin') && <EditModeToggle />}
					<LanguageSelector />
					<ThemeToggle />

					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger asChild>
							<button
								type='button'
								aria-label={t('nav.open_menu')}
								className='flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent sm:hidden'
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
										onClick={() => setMobileOpen(false)}
										className={cn(
											'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
											isActive(link.to)
												? 'bg-primary/90 text-primary-foreground shadow-sm'
												: 'text-muted-foreground hover:bg-accent hover:text-foreground'
										)}
									>
										{link.icon && <link.icon className='size-4' />}
										{link.label}
									</Link>
								))}
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	)
}
