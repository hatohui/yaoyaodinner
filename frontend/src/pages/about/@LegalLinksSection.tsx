import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
	BookOpen,
	ChevronRight,
	CircleHelp,
	FileText,
	HeartHandshake,
	LifeBuoy,
	Shield,
	UtensilsCrossed,
} from 'lucide-react'

const LEGAL_LINKS = [
	{
		section: 'privacy',
		icon: Shield,
	},
	{
		section: 'terms',
		icon: FileText,
	},
	{
		section: 'guidelines',
		icon: HeartHandshake,
	},
	{
		section: 'preorder',
		icon: UtensilsCrossed,
	},
	{
		section: 'contact',
		icon: LifeBuoy,
	},
] as const

export function LegalLinksSection() {
	const { t } = useTranslation()

	return (
		<section className='flex flex-col gap-5'>
			<div className='flex flex-wrap items-end justify-between gap-3'>
				<div>
					<span className='inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1 text-xs font-semibold text-primary shadow-xs'>
						<BookOpen className='size-3.5' />
						{t('legal.tag')}
					</span>
					<h2 className='mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
						{t('legal.title')}
					</h2>
					<p className='mt-1.5 text-sm text-muted-foreground sm:text-base'>
						{t('legal.subtitle')}
					</p>
				</div>
				<Link
					to='/legal'
					className='inline-flex items-center gap-1 text-sm font-semibold text-primary transition-opacity hover:opacity-80'
				>
					{t('legal.view_all')}
					<ChevronRight className='size-4' />
				</Link>
			</div>

			<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
				{LEGAL_LINKS.map(({ section, icon: Icon }) => (
					<Link
						key={section}
						to={`/legal?section=${section}`}
						className='group flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5'
					>
						<span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground'>
							<Icon className='size-4.5' />
						</span>
						<div className='min-w-0 flex-1'>
							<div className='flex items-center justify-between gap-2'>
								<h3 className='font-semibold text-foreground'>
									{t(`legal.sections.${section}.title`)}
								</h3>
								<ChevronRight className='size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary' />
							</div>
							<p className='mt-1 text-xs leading-relaxed text-muted-foreground'>
								{t(`legal.sections.${section}.summary`)}
							</p>
						</div>
					</Link>
				))}

				<Link
					to='/faq'
					className='group flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5'
				>
					<span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground'>
						<CircleHelp className='size-4.5' />
					</span>
					<div className='min-w-0 flex-1'>
						<div className='flex items-center justify-between gap-2'>
							<h3 className='font-semibold text-foreground'>
								{t('faq.title')}
							</h3>
							<ChevronRight className='size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary' />
						</div>
						<p className='mt-1 text-xs leading-relaxed text-muted-foreground'>
							{t('faq.subtitle')}
						</p>
					</div>
				</Link>
			</div>
		</section>
	)
}
