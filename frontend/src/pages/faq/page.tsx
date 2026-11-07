import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { BookOpen, ChevronRight, CircleHelp, Info } from 'lucide-react'
import { FaqList } from './@FaqList'

const INFO_PILLS = [
	'privacy',
	'terms',
	'guidelines',
	'preorder',
	'contact',
] as const

export default function FaqPage() {
	const { t } = useTranslation()

	return (
		<div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12'>
			<div>
				<span className='inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1 text-xs font-semibold text-primary shadow-xs'>
					<CircleHelp className='size-3.5' />
					{t('faq.tag')}
				</span>
				<h1 className='mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
					{t('faq.title')}
				</h1>
				<p className='mt-2 text-muted-foreground'>{t('faq.subtitle')}</p>
			</div>
			<FaqList />

			<div className='mt-2 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<div className='flex items-center gap-2 text-sm font-semibold text-foreground'>
						<BookOpen className='size-4 text-primary' />
						{t('legal.title')}
					</div>
					<Link
						to='/about'
						className='inline-flex items-center gap-1 text-xs font-semibold text-primary transition-opacity hover:opacity-80'
					>
						<Info className='size-3.5' />
						{t('nav.about')}
						<ChevronRight className='size-3.5' />
					</Link>
				</div>
				<p className='text-xs leading-relaxed text-muted-foreground'>
					{t('legal.subtitle')}
				</p>
				<div className='flex flex-wrap gap-1.5 pt-0.5'>
					{INFO_PILLS.map(section => (
						<Link
							key={section}
							to={`/legal?section=${section}`}
							className='inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
						>
							{t(`legal.sections.${section}.title`)}
						</Link>
					))}
				</div>
			</div>
		</div>
	)
}
