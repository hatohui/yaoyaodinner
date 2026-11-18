import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSetPersonAllergies } from '@/api/people/people'
import { getGetTablePeopleQueryKey } from '@/api/tables/tables'
import type {
	Allergen,
	OrderResponseDto,
	PersonDto,
	TableDto,
	TableWishDto,
} from '@/api/model'
import { useOrderCart } from '@/hooks/useOrderCart'
import { useOrderingStage } from '@/hooks/useOrderingStage'
import { useConfig } from '@/hooks/useConfig'
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { useToast } from '@/hooks/useToast'
import { downloadReceiptImage, type ReceiptSection } from '@/utils/receiptImage'
import {
	openPlanWishes,
	useTableWishes,
	wishStatus,
	wishToCartDish,
} from '@/hooks/useTableWishes'
import {
	allergyGroups,
	personalDishes,
	planText,
	type AllergyGroup,
} from './@planBoard'
import type { PlanAccess } from './@PlanAccessHint'

export function usePlanBoard(
	tableId: string,
	people: PersonDto[],
	orders: OrderResponseDto[],
	canEdit: boolean
) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const notify = useToast()
	const qc = useQueryClient()
	const board = useTableWishes(tableId)
	const cart = useOrderCart(tableId)
	const { canAdd, stage } = useOrderingStage()
	const { tablePlan, tableCodes } = useConfig()
	const { personId, hasIdentity } = useWhoAmI(tableId)
	const access: PlanAccess = !canEdit
		? tableCodes
			? 'locked'
			: hasIdentity
				? 'other_table'
				: 'pick_identity'
		: tablePlan && !personId
			? hasIdentity
				? 'other_table_ai'
				: 'pick_identity'
			: tablePlan && stage !== 'open'
				? 'ai_closed'
				: 'ready'
	const [editing, setEditing] = useState<PersonDto | null>(null)

	const orderedFoods = useMemo(
		() => new Set(orders.map(o => o.foodId)),
		[orders]
	)
	const statusOf = (wish: TableWishDto) =>
		wishStatus(wish, id => orderedFoods.has(id), cart.quantityOf)

	const must = board.wishes.filter(w => w.kind === 'must')
	const want = board.wishes.filter(w => w.kind === 'want')
	const avoid = board.wishes.filter(w => w.kind === 'avoid')
	const dishes = useMemo(
		() => personalDishes(orders, cart.lines, personId, people),
		[orders, cart.lines, personId, people]
	)
	const allergies = useMemo(() => allergyGroups(people), [people])

	const labelOf = (group: Pick<AllergyGroup, 'allergen' | 'label'>) =>
		group.allergen === 'other' && group.label
			? group.label
			: t(`plan_board.allergen.${group.allergen}`)

	const pendingCount = openPlanWishes(board.wishes, statusOf).length
	const viewCart = {
		label: t('plan_board.view_cart'),
		onClick: () => navigate(`/tables/${tableId}/order`),
	}

	const addToCart = (wish: TableWishDto) => {
		const dish = wishToCartDish(wish)
		if (!dish) return
		cart.addDish(dish, wish.personIds)
		toast.success(t('plan_board.added_to_cart', { name: wish.name }), {
			action: viewCart,
		})
	}

	const applyPlan = (chosen: TableWishDto[]) => {
		chosen.forEach(wish => {
			const dish = wishToCartDish(wish)
			if (dish) cart.addDish(dish, wish.personIds)
		})
		toast.success(t('plan_board.applied', { count: chosen.length }), {
			action: viewCart,
		})
	}

	const { mutate: saveAllergies, isPending: isSavingAllergies } =
		useSetPersonAllergies({
			mutation: {
				onSuccess: () => {
					qc.invalidateQueries({ queryKey: getGetTablePeopleQueryKey(tableId) })
					setEditing(null)
				},
				onError: () => notify.error(t('plan_board.save_failed')),
			},
		})

	const whoFor = (wish: TableWishDto) =>
		people.filter(p => wish.personIds.includes(p.id)).map(p => p.name)

	const copy = async () => {
		const text = planText({
			headings: {
				must: t('plan_board.must'),
				want: t('plan_board.want'),
				avoid: t('plan_board.avoid'),
				individual: t('plan_board.individual'),
				allergies: t('plan_board.allergies'),
			},
			must,
			want,
			avoid,
			dishes,
			allergies: allergies.map(g => ({ label: labelOf(g), people: g.people })),
			whoFor,
		})
		try {
			await navigator.clipboard.writeText(text)
			notify.success(t('plan_board.copied'))
		} catch {
			notify.error(t('plan_board.copy_failed'))
		}
	}

	const download = (table: TableDto) => {
		const wishSection = (
			heading: string,
			list: TableWishDto[],
			isAvoid = false
		): ReceiptSection => ({
			rows:
				list.length === 0
					? []
					: [
							{ left: heading, right: '', bold: true },
							...list.map(w => {
								const status = statusOf(w)
								const who = whoFor(w)
								return {
									left: w.variantLabel
										? `${w.name} · ${w.variantLabel}`
										: w.name,
									sub: who.length
										? who.join(', ')
										: !isAvoid
											? t('plan_board.whole_table')
											: undefined,
									right:
										status === 'ordered'
											? t('plan_board.status_ordered')
											: status === 'in_cart'
												? t('plan_board.status_in_cart')
												: '',
									muted: !isAvoid && status === 'ordered',
								}
							}),
						],
		})

		const sections: ReceiptSection[] = [
			wishSection(t('plan_board.must'), must),
			wishSection(t('plan_board.want'), want),
			wishSection(t('plan_board.avoid'), avoid, true),
			{
				rows:
					dishes.length === 0
						? []
						: [
								{ left: t('plan_board.individual'), right: '', bold: true },
								...dishes.map(d => ({
									left: `${d.name} ×${d.quantity}`,
									sub: d.people.join(', ') || undefined,
									right: d.inCart ? t('plan_board.status_in_cart') : '',
								})),
							],
			},
			{
				rows:
					allergies.length === 0
						? []
						: [
								{ left: t('plan_board.allergies'), right: '', bold: true },
								...allergies.map(g => ({
									left: labelOf(g),
									right: g.people.join(', '),
									highlight: true,
								})),
							],
			},
		]

		const slug =
			(table.name || `table-${table.no}`)
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '') || 'plan'
		downloadReceiptImage({
			filename: `${slug}-plan.png`,
			title: `${table.no}. ${table.name || t('roster.table_no', { no: table.no })} · ${t('tabs.plan')}`,
			sections,
		})
	}

	return {
		...board,
		must,
		want,
		avoid,
		dishes,
		allergies,
		isEmpty:
			board.wishes.length === 0 &&
			dishes.length === 0 &&
			allergies.length === 0,
		statusOf,
		labelOf,
		canAddToCart: canEdit && canAdd,
		access,
		canUseAi: Boolean(tablePlan && canEdit && personId && stage === 'open'),
		addToCart,
		pendingCount,
		applyPlan,
		copy,
		download,
		editing,
		setEditing,
		isSavingAllergies,
		saveAllergies: (allergies: { allergen: Allergen; label?: string }[]) =>
			editing && saveAllergies({ id: editing.id, data: { allergies } }),
	}
}
