import { useTranslation } from 'react-i18next'
import {
	CalendarHeart,
	Camera,
	HeartHandshake,
	KeyRound,
	LayoutGrid,
	Sparkles,
	UserCheck,
	UtensilsCrossed,
} from 'lucide-react'

const FEATURES = [
	{ key: 'gatherings', icon: CalendarHeart },
	{ key: 'spaces', icon: LayoutGrid },
	{ key: 'codes', icon: KeyRound },
	{ key: 'memories', icon: Camera },
	{ key: 'preorders', icon: UtensilsCrossed },
	{ key: 'archive', icon: Sparkles },
] as const

export function ProjectInfoSection() {
	const { t } = useTranslation()

	return (
		<section className='flex flex-col gap-6'>
			<div>
				<span className='inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1 text-xs font-semibold text-primary shadow-xs'>
					<HeartHandshake className='size-3.5' />
					{t('about.project.tag')}
				</span>
				<h2 className='mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
					{t('about.project.title')}
				</h2>
				<p className='mt-2 max-w-3xl leading-relaxed text-muted-foreground'>
					{t('about.project.intro')}
				</p>
			</div>

			<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
				{FEATURES.map(({ key, icon: Icon }) => (
					<div
						key={key}
						className='flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-5 shadow-sm'
					>
						<span className='flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary'>
							<Icon className='size-4.5' />
						</span>
						<h3 className='font-semibold text-foreground'>
							{t(`about.project.features.${key}_title`)}
						</h3>
						<p className='text-sm leading-relaxed text-muted-foreground'>
							{t(`about.project.features.${key}_body`)}
						</p>
					</div>
				))}
			</div>

			<div className='flex flex-col gap-3 rounded-3xl border border-primary/25 bg-card p-6 shadow-sm sm:flex-row sm:items-start sm:gap-4'>
				<span className='flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary'>
					<UserCheck className='size-5' />
				</span>
				<div className='flex flex-col gap-1.5'>
					<h3 className='font-bold text-foreground'>
						{t('about.project.identity_title')}
					</h3>
					<p className='text-sm leading-relaxed text-muted-foreground'>
						{t('about.project.identity_body_1')}
					</p>
					<p className='text-sm leading-relaxed text-muted-foreground'>
						{t('about.project.identity_body_2')}
					</p>
				</div>
			</div>
		</section>
	)
}
