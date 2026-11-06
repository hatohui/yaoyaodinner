import type { LucideIcon } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

interface UnlockLayoutProps {
	icon: LucideIcon
	title: string
	subtitle: string
	children: React.ReactNode
}

export function UnlockLayout({
	icon: Icon,
	title,
	subtitle,
	children,
}: UnlockLayoutProps) {
	const { t } = useTranslation()

	return (
		<div className='mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col px-4 py-6'>
			<Link
				to='/'
				className='inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary'
			>
				<ArrowLeft className='size-4' />
				{t('access.back')}
			</Link>

			<div className='flex flex-1 items-center justify-center py-6'>
				<div className='w-full rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-lg'>
					<div className='flex flex-col items-center gap-6'>
						<div className='flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
							<Icon className='size-7' />
						</div>

						<div className='space-y-1.5'>
							<h1 className='text-2xl font-bold text-foreground'>{title}</h1>
							<p className='text-sm text-muted-foreground'>{subtitle}</p>
						</div>

						{children}
					</div>
				</div>
			</div>
		</div>
	)
}
