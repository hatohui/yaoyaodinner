import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAdmin } from '@/hooks/useAdmin'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed'
import { cn } from '@/utils/shadcn'
import { AdminUnlock } from '@/components/common/AdminUnlock'
import { Spinner } from '@/components/ui/spinner'
import { AdminSidebar } from './@AdminSidebar'
import { EventContextSwitcher } from './@EventContextSwitcher'

const AdminLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactElement => {
	const { t } = useTranslation()
	const passphrase = useAdmin(s => s.passphrase)
	const { isAdmin, isVerifying } = useIsAdmin()
	const [mobileNavOpen, setMobileNavOpen] = useState(false)
	const collapsed = useSidebarCollapsed(s => s.collapsed)
	const toggleCollapsed = useSidebarCollapsed(s => s.toggle)

	if (!passphrase) return <AdminUnlock />
	if (isVerifying) {
		return (
			<div className='flex min-h-[calc(100vh-3.5rem)] items-center justify-center'>
				<Spinner />
			</div>
		)
	}
	if (!isAdmin) return <AdminUnlock />

	return (
		<div className='mx-auto flex max-w-6xl gap-6 px-4 py-6 lg:pl-0'>
			<aside
				className={cn(
					'hidden shrink-0 transition-[width] duration-200 lg:block',
					collapsed ? 'w-14' : 'w-56'
				)}
			>
				<div className='sticky top-20 flex flex-col gap-4'>
					<div
						className={cn(
							'flex items-center gap-1',
							collapsed ? 'justify-center' : 'justify-between px-4'
						)}
					>
						{!collapsed && (
							<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
								{t('admin.nav.title')}
							</p>
						)}
						<button
							type='button'
							onClick={toggleCollapsed}
							title={t(collapsed ? 'admin.nav.expand' : 'admin.nav.collapse')}
							aria-label={t(
								collapsed ? 'admin.nav.expand' : 'admin.nav.collapse'
							)}
							aria-expanded={!collapsed}
							className='flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
						>
							{collapsed ? (
								<PanelLeftOpen className='size-4' />
							) : (
								<PanelLeftClose className='size-4' />
							)}
						</button>
					</div>
					{!collapsed && <EventContextSwitcher />}
					<AdminSidebar collapsed={collapsed} />
				</div>
			</aside>

			<div className='min-w-0 flex-1'>
				<div className='mb-4 flex items-center justify-between lg:hidden'>
					<p className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
						{t('admin.nav.title')}
					</p>
					<button
						type='button'
						onClick={() => setMobileNavOpen(v => !v)}
						aria-label={t('admin.nav.toggle')}
						className='flex size-9 items-center justify-center rounded-full border border-border/60 bg-card text-foreground'
					>
						{mobileNavOpen ? (
							<X className='size-4' />
						) : (
							<Menu className='size-4' />
						)}
					</button>
				</div>

				{mobileNavOpen && (
					<div className='mb-4 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-2 shadow-sm lg:hidden'>
						<EventContextSwitcher />
						<AdminSidebar onNavigate={() => setMobileNavOpen(false)} />
					</div>
				)}

				{children}
			</div>
		</div>
	)
}

export default AdminLayout
