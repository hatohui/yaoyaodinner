import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus } from 'lucide-react'
import { getGetFoodByIdQueryOptions } from '@/api/foods/foods'
import { useGetTablePeople } from '@/api/tables/tables'
import { useCreateOrder, getGetOrdersQueryKey } from '@/api/orders/orders'
import type { FoodDetailDto, FoodVariantDto, PersonDto } from '@/api/model'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
	SplitModeSelector,
	type SplitMode,
} from '@/components/common/SplitModeSelector'
import { useWhoAmI } from '@/hooks/useWhoAmI'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/shadcn'
import { STALE_TIME_STATIC } from '@/common/constants'

export interface ConfigFoodInput {
	id: string
	name: string
	defaultVariantId: string | null
	variants?: FoodVariantDto[]
}

interface ItemConfig {
	variantId: string
	quantity: number
	mode: SplitMode
	chosen: Set<string>
}

interface OrderConfigModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	tableId: string | null
	foods: ConfigFoodInput[]
	onSuccess: () => void
}

export function OrderConfigModal({
	open,
	onOpenChange,
	tableId,
	foods,
	onSuccess,
}: OrderConfigModalProps) {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const [configs, setConfigs] = useState<Record<string, ItemConfig>>({})

	const { data: people = [], isLoading: peopleLoading } = useGetTablePeople<
		PersonDto[]
	>(tableId ?? '', {
		query: { enabled: open && !!tableId },
	})
	const { personId: myPersonId } = useWhoAmI(tableId ?? '')

	const idsNeedingFetch = foods.filter(f => !f.variants).map(f => f.id)
	const variantQueries = useQueries({
		queries: idsNeedingFetch.map(id => ({
			...getGetFoodByIdQueryOptions<FoodDetailDto>(id, {
				lang: i18n.language,
			}),
			staleTime: STALE_TIME_STATIC,
			enabled: open,
		})),
	})
	const fetchedVariants: Record<string, FoodVariantDto[]> = {}
	idsNeedingFetch.forEach((id, idx) => {
		const data = variantQueries[idx]?.data
		if (data) fetchedVariants[id] = data.variants
	})
	const variantsLoading = variantQueries.some(q => q.isLoading)

	const variantsFor = (f: ConfigFoodInput) =>
		f.variants ?? fetchedVariants[f.id] ?? []

	useEffect(() => {
		if (!open) return
		setConfigs(prev => {
			const next = { ...prev }
			for (const f of foods) {
				if (!next[f.id]) {
					next[f.id] = {
						variantId: f.defaultVariantId ?? variantsFor(f)[0]?.id ?? '',
						quantity: 1,
						mode: 'table',
						chosen: new Set(),
					}
				}
			}
			return next
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, foods])

	useEffect(() => {
		if (!open) setConfigs({})
	}, [open])

	const update = (foodId: string, patch: Partial<ItemConfig>) => {
		setConfigs(prev => ({
			...prev,
			[foodId]: { ...prev[foodId], ...patch },
		}))
	}

	const toggleChosen = (foodId: string, personId: string) => {
		setConfigs(prev => {
			const cfg = prev[foodId]
			if (!cfg) return prev
			const next = new Set(cfg.chosen)
			if (next.has(personId)) next.delete(personId)
			else next.add(personId)
			return { ...prev, [foodId]: { ...cfg, chosen: next } }
		})
	}

	const { mutateAsync, isPending } = useCreateOrder()

	const canConfirm = tableId
		? foods.every(f => {
				const cfg = configs[f.id]
				if (!cfg || !cfg.variantId) return false
				if (cfg.mode === 'choose') return cfg.chosen.size > 0
				if (cfg.mode === 'me') return Boolean(myPersonId)
				return true
			})
		: false

	const handleConfirm = async () => {
		if (!tableId || !canConfirm) return
		try {
			await Promise.all(
				foods.map(f => {
					const cfg = configs[f.id]
					const splitAll = cfg.mode === 'table'
					const personIds =
						cfg.mode === 'me' && myPersonId
							? [myPersonId]
							: cfg.mode === 'choose'
								? [...cfg.chosen]
								: []
					return mutateAsync({
						data: {
							tableId,
							variantId: cfg.variantId,
							quantity: cfg.quantity,
							splitAll,
							personIds,
						},
					})
				})
			)
			qc.invalidateQueries({ queryKey: getGetOrdersQueryKey({ tableId }) })
			toast.success(t('menu.added_to_order'))
			onOpenChange(false)
			onSuccess()
		} catch {
			toast.error(t('menu.add_failed'))
		}
	}

	const loading = peopleLoading || variantsLoading

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[85vh] flex-col rounded-3xl'>
				<DialogHeader>
					<DialogTitle>{t('menu.configure_title')}</DialogTitle>
				</DialogHeader>

				{loading ? (
					<div className='flex justify-center py-8'>
						<Spinner />
					</div>
				) : (
					<div className='scrollbar-thin flex flex-col gap-4 overflow-y-auto'>
						{foods.map(f => {
							const cfg = configs[f.id]
							if (!cfg) return null
							const variants = variantsFor(f)

							return (
								<div
									key={f.id}
									className='flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3'
								>
									<span className='font-medium text-foreground'>{f.name}</span>

									{variants.length > 1 && (
										<div className='flex flex-wrap gap-2'>
											{variants
												.filter(v => v.isAvailable)
												.map(v => (
													<button
														key={v.id}
														type='button'
														onClick={() => update(f.id, { variantId: v.id })}
														className={cn(
															'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
															cfg.variantId === v.id
																? 'border-primary bg-primary text-primary-foreground'
																: 'border-border/60 bg-card text-foreground hover:bg-muted'
														)}
													>
														{v.label ? `${v.label} - ` : ''}
														{v.price} {v.currency}
													</button>
												))}
										</div>
									)}

									<div className='flex items-center gap-2'>
										<button
											type='button'
											onClick={() =>
												update(f.id, {
													quantity: Math.max(1, cfg.quantity - 1),
												})
											}
											disabled={cfg.quantity <= 1}
											className='flex size-7 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted disabled:opacity-40'
										>
											<Minus className='size-3.5' />
										</button>
										<span className='w-6 text-center text-sm font-medium text-foreground'>
											{cfg.quantity}
										</span>
										<button
											type='button'
											onClick={() =>
												update(f.id, { quantity: cfg.quantity + 1 })
											}
											className='flex size-7 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted'
										>
											<Plus className='size-3.5' />
										</button>
									</div>

									<SplitModeSelector
										people={people}
										mode={cfg.mode}
										onModeChange={mode => update(f.id, { mode })}
										chosen={cfg.chosen}
										onToggle={personId => toggleChosen(f.id, personId)}
										myPersonId={myPersonId}
									/>
								</div>
							)
						})}
					</div>
				)}

				<DialogFooter>
					<Button
						className='rounded-full'
						disabled={!canConfirm || isPending || loading}
						onClick={handleConfirm}
					>
						{isPending ? t('menu.adding') : t('menu.add_to_order')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
