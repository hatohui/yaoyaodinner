import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useGuest } from '@/hooks/useGuest'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useIdentityTour, type TourPath } from '@/hooks/useIdentityTour'
import { TourSpotlight } from './TourSpotlight'
import { TourWelcome } from './TourWelcome'
import { TourDots, TOUR_STEPS } from './TourDots'
import { useTourFrame, type TourStep } from './useTourFrame'

const TABLE_ROUTE = /^\/tables\/(?!map$)[^/]+$/

const one = (tour: string) => document.querySelector(`[data-tour="${tour}"]`)
const all = (tour: string) =>
	Array.from(document.querySelectorAll(`[data-tour="${tour}"]`))
const step = (key: string, targets: (Element | null)[]): TourStep => ({
	key,
	targets: targets.filter(el => el !== null),
})

function resolveListStep(path: TourPath, query: string): TourStep | null {
	const tables = one('tables')
	if (path === 'browse') return tables ? step('browse', [tables]) : null

	const search = one('search')
	if (!search) return null
	if (!query) return step('search', [search])
	const matches = all('match')
	if (matches.length > 0) return step('match', [...matches, search])
	if (tables) return step('pick', [tables])
	return step('no_match', [search])
}

function resolveTableStep(query: string): TourStep | null {
	const code = one('table-code')
	if (code) return step('code', [code])

	const needle = query.toLowerCase()
	const rows = needle
		? all('person').filter(el =>
				el.getAttribute('data-name')?.toLowerCase().includes(needle)
			)
		: []
	if (rows.length > 0) return step('roster_match', rows)

	const roster = one('roster')
	if (roster) return step('roster', [roster])
	const tab = one('people-tab')
	return tab ? step('people_tab', [tab]) : null
}

const STEP_NUMBER: Record<string, number> = {
	search: 2,
	match: 2,
	pick: 2,
	no_match: 2,
	browse: 2,
	code: 3,
	roster_match: 3,
	roster: 3,
	people_tab: 3,
	done: TOUR_STEPS,
}

export function IdentityTour() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { pathname } = useLocation()
	const { isAdmin } = useIsAdmin()
	const me = useGuest(s => s.me)
	const { open, path, query, choose, finish } = useIdentityTour()

	const onList = pathname === '/tables'
	const onTable = TABLE_ROUTE.test(pathname)
	const active = open && !isAdmin
	const showWelcome = active && !me && path === null && !onTable

	const resolve = useCallback((): TourStep | null => {
		if (me) return step('done', [one('identity')])
		if (onTable) return resolveTableStep(query)
		if (onList && path) return resolveListStep(path, query)
		return null
	}, [me, onTable, onList, path, query])

	const frame = useTourFrame(active && !showWelcome ? resolve : null)
	const key = frame.key

	useEffect(() => {
		if (key !== 'search') return
		document
			.querySelector<HTMLInputElement>('[data-tour="search"] input')
			?.focus()
	}, [key])

	useEffect(() => {
		if (!key) return
		const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && finish()
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [key, finish])

	const pick = (next: TourPath | null) => {
		choose(next)
		if (!onList) navigate('/tables')
	}

	if (!active) return null

	if (showWelcome) {
		return <TourWelcome open onChoose={pick} onSkip={finish} />
	}

	if (!key) return null

	const title =
		key === 'done'
			? t('onboarding.done_title', { name: me?.name })
			: t(`onboarding.${key}_title` as 'onboarding.search_title')
	const body = t(`onboarding.${key}_body` as 'onboarding.search_body')

	return (
		<TourSpotlight stepKey={key} rects={frame.rects}>
			<div className='flex flex-col gap-1'>
				<p className='font-semibold text-foreground'>{title}</p>
				<p className='text-sm text-muted-foreground'>{body}</p>
			</div>
			<div className='flex items-center justify-between gap-2'>
				<TourDots current={STEP_NUMBER[key]} />
				{key === 'done' ? (
					<Button size='sm' className='rounded-full' onClick={finish}>
						{t('onboarding.got_it')}
					</Button>
				) : (
					<div className='flex items-center gap-1'>
						<Button
							variant='ghost'
							size='sm'
							className='rounded-full text-muted-foreground'
							onClick={onTable ? () => navigate('/tables') : () => pick(null)}
						>
							{t('common.back')}
						</Button>
						{key === 'no_match' ? (
							<Button
								size='sm'
								className='rounded-full'
								onClick={() => pick('browse')}
							>
								{t('onboarding.browse_option')}
							</Button>
						) : (
							<Button
								variant='outline'
								size='sm'
								className='rounded-full'
								onClick={finish}
							>
								{t('onboarding.skip')}
							</Button>
						)}
					</div>
				)}
			</div>
		</TourSpotlight>
	)
}
