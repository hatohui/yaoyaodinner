import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import {
	ArrowLeft,
	BookOpen,
	FileText,
	HeartHandshake,
	LifeBuoy,
	Shield,
	UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/utils/shadcn'
import { LegalSectionCard, type LegalSectionId } from './@LegalSectionCard'

const SECTIONS: {
	id: LegalSectionId
	icon: typeof Shield
	itemKeys: readonly string[]
}[] = [
	{
		id: 'privacy',
		icon: Shield,
		itemKeys: ['no_accounts', 'shared_info', 'device_storage', 'removal'],
	},
	{
		id: 'terms',
		icon: FileText,
		itemKeys: ['non_commercial', 'access_codes', 'unverified_names', 'bills'],
	},
	{
		id: 'guidelines',
		icon: HeartHandshake,
		itemKeys: ['be_kind', 'appropriate_posts', 'respect_tables', 'moderation'],
	},
	{
		id: 'preorder',
		icon: UtensilsCrossed,
		itemKeys: ['stages', 'splitting', 'dietary_notes', 'changes'],
	},
	{
		id: 'contact',
		icon: LifeBuoy,
		itemKeys: ['report_issue', 'content_removal', 'host_help', 'self_service'],
	},
]

const isLegalSection = (value: string | null): value is LegalSectionId =>
	SECTIONS.some(s => s.id === value)

export default function LegalPage() {
	const { t } = useTranslation()
	const [searchParams, setSearchParams] = useSearchParams()
	const rawSection = searchParams.get('section')
	const activeSection: LegalSectionId | 'all' = isLegalSection(rawSection)
		? rawSection
		: 'all'

	const selectSection = (next: LegalSectionId | 'all') => {
		setSearchParams(params => {
			if (next === 'all') {
				params.delete('section')
			} else {
				params.set('section', next)
			}
			return params
		})
	}

	const visibleSections =
		activeSection === 'all'
			? SECTIONS
			: SECTIONS.filter(section => section.id === activeSection)

	return (
		<div className='mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:py-12'>
			<Link
				to='/about'
				className='inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
			>
				<ArrowLeft className='size-4' />
				{t('legal.back_to_about')}
			</Link>

			<div>
				<span className='inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1 text-xs font-semibold text-primary shadow-xs'>
					<BookOpen className='size-3.5' />
					{t('legal.tag')}
				</span>
				<h1 className='mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
					{t('legal.title')}
				</h1>
				<p className='mt-2 text-muted-foreground'>{t('legal.subtitle')}</p>
			</div>

			<div
				role='tablist'
				aria-label={t('legal.title')}
				className='flex flex-wrap items-center gap-2'
			>
				<button
					type='button'
					role='tab'
					aria-selected={activeSection === 'all'}
					onClick={() => selectSection('all')}
					className={cn(
						'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
						activeSection === 'all'
							? 'border-primary bg-primary text-primary-foreground shadow-xs'
							: 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
					)}
				>
					{t('legal.all_sections')}
				</button>
				{SECTIONS.map(({ id, icon: Icon }) => {
					const active = activeSection === id
					return (
						<button
							key={id}
							type='button'
							role='tab'
							aria-selected={active}
							onClick={() => selectSection(id)}
							className={cn(
								'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
								active
									? 'border-primary bg-primary text-primary-foreground shadow-xs'
									: 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
							)}
						>
							<Icon className='size-3.5' />
							{t(`legal.sections.${id}.title`)}
						</button>
					)
				})}
			</div>

			<div className='flex flex-col gap-5'>
				{visibleSections.map(section => (
					<LegalSectionCard
						key={section.id}
						id={section.id}
						icon={section.icon}
						itemKeys={section.itemKeys}
					/>
				))}
			</div>
		</div>
	)
}
