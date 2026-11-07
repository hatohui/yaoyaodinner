import type { LucideIcon } from 'lucide-react'
import { CircleHelp, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export type LegalSectionId =
	| 'privacy'
	| 'terms'
	| 'guidelines'
	| 'preorder'
	| 'contact'

interface LegalSectionCardProps {
	id: LegalSectionId
	icon: LucideIcon
	itemKeys: readonly string[]
}

const HOST_CONTACTS = [
	{
		label: 'Chee Yao (Facebook)',
		href: 'https://www.facebook.com/chee.yao.963',
	},
	{
		label: '@Huskyaoo (X)',
		href: 'https://x.com/Huskyaoo',
	},
	{
		label: '@asterdragon_ (X)',
		href: 'https://x.com/asterdragon_',
	},
] as const

export function LegalSectionCard({
	id,
	icon: Icon,
	itemKeys,
}: LegalSectionCardProps) {
	const { t } = useTranslation()

	return (
		<article
			id={id}
			className='flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8'
		>
			<div className='flex items-start gap-3.5'>
				<span className='flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary'>
					<Icon className='size-5' />
				</span>
				<div>
					<h2 className='text-xl font-bold text-foreground sm:text-2xl'>
						{t(`legal.sections.${id}.title`)}
					</h2>
					<p className='mt-1 text-sm leading-relaxed text-muted-foreground'>
						{t(`legal.sections.${id}.intro`)}
					</p>
				</div>
			</div>

			<div className='grid gap-3 sm:grid-cols-2'>
				{itemKeys.map(itemKey => (
					<div
						key={itemKey}
						className='flex flex-col gap-1.5 rounded-2xl border border-border/70 bg-background/50 p-4'
					>
						<h3 className='text-sm font-semibold text-foreground'>
							{t(`legal.sections.${id}.items.${itemKey}_title`)}
						</h3>
						<p className='text-sm leading-relaxed text-muted-foreground'>
							{t(`legal.sections.${id}.items.${itemKey}_body`)}
						</p>
					</div>
				))}
			</div>

			{id === 'contact' && (
				<div className='flex flex-wrap items-center gap-2 border-t border-border pt-4'>
					{HOST_CONTACTS.map(contact => (
						<a
							key={contact.href}
							href={contact.href}
							target='_blank'
							rel='noopener noreferrer'
							className='inline-flex items-center gap-1.5 rounded-full border border-border bg-control px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
						>
							{contact.label}
							<ExternalLink className='size-3.5' />
						</a>
					))}
					<Link
						to='/faq'
						className='inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground'
					>
						<CircleHelp className='size-3.5' />
						{t('legal.contact_faq_cta')}
					</Link>
				</div>
			)}
		</article>
	)
}
