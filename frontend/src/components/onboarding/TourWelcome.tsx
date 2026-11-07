import { useTranslation } from 'react-i18next'
import { LayoutGrid, UserSearch, type LucideIcon } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { TourPath } from '@/hooks/useIdentityTour'
import { TourDots } from './TourDots'

interface TourWelcomeProps {
	open: boolean
	onChoose: (path: TourPath) => void
	onSkip: () => void
}

export function TourWelcome({ open, onChoose, onSkip }: TourWelcomeProps) {
	const { t } = useTranslation()

	return (
		<Dialog open={open} onOpenChange={next => !next && onSkip()}>
			<DialogContent
				showCloseButton={false}
				overlayClassName='bg-scrim'
				className='gap-5 rounded-3xl p-5 sm:max-w-md sm:p-6'
			>
				<DialogHeader className='text-left'>
					<DialogTitle className='text-xl'>
						{t('onboarding.welcome_title')}
					</DialogTitle>
					<DialogDescription>{t('onboarding.welcome_body')}</DialogDescription>
				</DialogHeader>

				<div className='grid gap-3 sm:grid-cols-2'>
					<PathOption
						icon={UserSearch}
						title={t('onboarding.search_option')}
						hint={t('onboarding.search_option_hint')}
						onClick={() => onChoose('search')}
						autoFocus
					/>
					<PathOption
						icon={LayoutGrid}
						title={t('onboarding.browse_option')}
						hint={t('onboarding.browse_option_hint')}
						onClick={() => onChoose('browse')}
					/>
				</div>

				<div className='flex items-center justify-between'>
					<Button
						variant='ghost'
						size='sm'
						className='-ml-2 rounded-full text-muted-foreground'
						onClick={onSkip}
					>
						{t('onboarding.skip')}
					</Button>
					<TourDots current={1} />
				</div>
			</DialogContent>
		</Dialog>
	)
}

interface PathOptionProps {
	icon: LucideIcon
	title: string
	hint: string
	onClick: () => void
	autoFocus?: boolean
}

function PathOption({
	icon: Icon,
	title,
	hint,
	onClick,
	autoFocus,
}: PathOptionProps) {
	return (
		<button
			type='button'
			onClick={onClick}
			autoFocus={autoFocus}
			className='group flex cursor-pointer flex-col items-start gap-2 rounded-2xl border border-border bg-control p-4 text-left shadow-xs outline-none transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-brand-muted focus-visible:ring-2 focus-visible:ring-ring'
		>
			<span className='flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground'>
				<Icon className='size-5' />
			</span>
			<span className='font-semibold text-foreground'>{title}</span>
			<span className='text-xs text-muted-foreground'>{hint}</span>
		</button>
	)
}
