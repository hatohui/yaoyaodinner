import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { CategoryItemDto, FoodVariantDto } from '@/api/model'
import type { FoodGridRow } from './@useFoodCatalog'
import { DataGrid } from '@/components/data-grid/data-grid'
import { getDataGridSelectColumn } from '@/components/data-grid/data-grid-select-column'
import { useDataGrid } from '@/hooks/use-data-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataGridSkeleton } from '@/components/common/ListSkeletons'
import { DollarSign, LayoutGrid, Table2, UtensilsCrossed } from 'lucide-react'
import { StoredImage } from '@/components/common/StoredImage'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EditFoodDialog } from './@EditFoodDialog'
import { cn } from '@/utils/shadcn'
import { localStorage } from '@/utils/localstorage'
import { ADMIN_FOOD_VIEW_STORAGE_KEY } from '@/common/constants'

export type AdminFoodView = 'table' | 'gallery' | 'price'

export function useAdminFoodView() {
	const [view, setViewState] = React.useState<AdminFoodView>(() => {
		const saved = localStorage.load(ADMIN_FOOD_VIEW_STORAGE_KEY)
		if (saved === 'gallery' || saved === 'price') return saved
		return 'table'
	})
	const setView = (next: AdminFoodView) => {
		localStorage.save(ADMIN_FOOD_VIEW_STORAGE_KEY, next)
		setViewState(next)
	}
	return { view, setView }
}

export function AdminFoodViewToggle({
	view,
	onChange,
}: {
	view: AdminFoodView
	onChange: (view: AdminFoodView) => void
}) {
	const { t } = useTranslation()
	const options = [
		{ value: 'table', icon: Table2, label: t('admin.food.view_table') },
		{ value: 'gallery', icon: LayoutGrid, label: t('admin.food.view_gallery') },
		{ value: 'price', icon: DollarSign, label: t('admin.food.price') },
	] as const

	return (
		<div className='flex shrink-0 items-center gap-1 rounded-full border border-border bg-control p-0.5 shadow-sm'>
			{options.map(({ value, icon: Icon, label }) => (
				<button
					key={value}
					type='button'
					onClick={() => onChange(value)}
					aria-label={label}
					title={label}
					aria-pressed={view === value}
					className={cn(
						'flex size-8 items-center justify-center rounded-full transition-colors',
						view === value
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'
					)}
				>
					<Icon className='size-4' />
				</button>
			))}
		</div>
	)
}

function VariantPriceField({
	variant,
	foodName,
	showLabel,
	onCommit,
}: {
	variant: FoodVariantDto
	foodName: string
	showLabel: boolean
	onCommit: (patch: { price: number | null; isSeasonal: boolean }) => void
}) {
	const { t } = useTranslation()
	const saved =
		variant.isSeasonal || variant.price == null || variant.price <= 0
			? ''
			: String(variant.price)
	const [draft, setDraft] = React.useState(saved)

	React.useEffect(() => {
		setDraft(saved)
	}, [saved])

	const commit = () => {
		const trimmed = draft.trim()
		if (trimmed === saved) return
		if (trimmed === '') {
			onCommit({ price: null, isSeasonal: true })
			return
		}
		const num = Math.round(Number(trimmed) * 100) / 100
		if (!Number.isFinite(num) || num <= 0) {
			setDraft(saved)
			return
		}
		onCommit({ price: num, isSeasonal: false })
	}

	return (
		<div className='flex flex-col gap-1'>
			{showLabel && variant.label && (
				<span className='truncate text-[11px] font-medium text-muted-foreground'>
					{variant.label}
				</span>
			)}
			<label className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
				<Input
					type='number'
					inputMode='decimal'
					min={0}
					step='0.01'
					value={draft}
					placeholder={t('menu.seasonal_price')}
					aria-label={`${foodName} ${variant.label ?? ''}`.trim()}
					onChange={e => setDraft(e.target.value)}
					onBlur={commit}
					onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
					className={cn(
						'h-8 rounded-full px-3 text-right text-xs font-semibold tabular-nums',
						draft === '' && 'border-dashed'
					)}
				/>
				<span className='shrink-0'>{variant.currency ?? 'RM'}</span>
			</label>
		</div>
	)
}

interface FoodTableProps {
	view: AdminFoodView
	foods: FoodGridRow[]
	categories: CategoryItemDto[]
	isLoading: boolean
	onDataChange: (updated: FoodGridRow[]) => void
	onUpdateVariant: (
		variantId: string,
		patch: { price?: number | null; isSeasonal?: boolean }
	) => void
	onDelete: (id: string) => void
	onBulkToggle: (ids: string[], isAvailable: boolean) => void
	onBulkDelete: (ids: string[]) => void
	onTranslate: (food: FoodGridRow) => void
}

export function FoodTable({
	view,
	foods,
	categories,
	isLoading,
	onDataChange,
	onUpdateVariant,
	onDelete,
	onBulkToggle,
	onBulkDelete,
	onTranslate,
}: FoodTableProps) {
	const { t } = useTranslation()
	const [editing, setEditing] = React.useState<FoodGridRow | null>(null)
	const [confirmBulkDelete, setConfirmBulkDelete] = React.useState(false)

	const categoryOptions = React.useMemo(
		() => categories.map(c => ({ label: c.name ?? '', value: c.id })),
		[categories]
	)

	const columns = React.useMemo<ColumnDef<FoodGridRow>[]>(
		() => [
			getDataGridSelectColumn<FoodGridRow>(),
			{
				id: 'name',
				accessorKey: 'name',
				header: t('admin.food.name'),
				size: 220,
				meta: { label: t('admin.food.name'), cell: { variant: 'short-text' } },
			},
			{
				id: 'categoryId',
				accessorKey: 'categoryId',
				header: t('admin.food.category'),
				size: 160,
				meta: {
					label: t('admin.food.category'),
					cell: {
						variant: 'select',
						options: categoryOptions,
					},
				},
			},
			{
				id: 'description',
				accessorKey: 'description',
				header: t('admin.food.description'),
				size: 240,
				meta: {
					label: t('admin.food.description'),
					cell: { variant: 'long-text' },
				},
			},
			{
				id: 'price',
				accessorKey: 'price',
				header: t('admin.food.price'),
				size: 110,
				meta: { label: t('admin.food.price'), cell: { variant: 'number' } },
			},
			{
				id: 'isSeasonal',
				accessorKey: 'isSeasonal',
				header: t('admin.food.seasonal'),
				size: 120,
				meta: {
					label: t('admin.food.seasonal'),
					cell: { variant: 'checkbox' },
				},
			},
			{
				id: 'currency',
				accessorKey: 'currency',
				header: t('admin.food.currency'),
				size: 110,
				meta: {
					label: t('admin.food.currency'),
					cell: { variant: 'short-text' },
				},
			},
			{
				id: 'orderCount',
				accessorKey: 'orderCount',
				header: () => t('admin.food.ordered'),
				size: 100,
				cell: ({ row }) => (
					<span className='block text-right tabular-nums text-muted-foreground'>
						{row.original.orderCount}
					</span>
				),
			},
			{
				id: 'isAvailable',
				accessorKey: 'isAvailable',
				header: t('admin.food.available'),
				size: 110,
				meta: {
					label: t('admin.food.available'),
					cell: { variant: 'checkbox' },
				},
			},
			{
				id: 'isRecommended',
				accessorKey: 'isRecommended',
				header: t('admin.food.recommended'),
				size: 130,
				meta: {
					label: t('admin.food.recommended'),
					cell: { variant: 'checkbox' },
				},
			},
			{
				id: 'shouldCalculate',
				accessorKey: 'shouldCalculate',
				header: t('admin.food.calculated'),
				size: 150,
				meta: {
					label: t('admin.food.calculated'),
					cell: { variant: 'checkbox' },
				},
			},
		],
		[t, categoryOptions]
	)

	const onRowsDelete = React.useCallback(
		(rows: FoodGridRow[]) => {
			const ids = rows.map(r => r.id)
			if (ids.length === 1) {
				onDelete(ids[0])
			} else {
				onBulkDelete(ids)
			}
		},
		[onDelete, onBulkDelete]
	)

	const { table, ...dataGridProps } = useDataGrid({
		data: foods,
		columns,
		onDataChange,
		onRowsDelete,
		getRowId: row => row.id,
	})

	const selected = table.getSelectedRowModel().rows
	const selectedIds = selected.map(r => r.original.id)

	if (isLoading) {
		return <DataGridSkeleton rows={12} columns={6} />
	}

	if (foods.length === 0) {
		return (
			<p className='py-16 text-center text-sm text-muted-foreground'>
				{t('admin.food.empty')}
			</p>
		)
	}

	return (
		<div className='flex flex-col gap-3'>
			{view === 'table' && selectedIds.length > 0 && (
				<div className='flex flex-wrap items-center gap-2'>
					<span className='text-sm font-medium text-foreground'>
						{t('admin.tables.selected_count', { count: selectedIds.length })}
					</span>
					<Button
						size='sm'
						variant='outline'
						className='rounded-full'
						onClick={() => {
							onBulkToggle(selectedIds, true)
							table.resetRowSelection()
						}}
					>
						{t('admin.food.bulk_enable')}
					</Button>
					<Button
						size='sm'
						variant='outline'
						className='rounded-full'
						onClick={() => {
							onBulkToggle(selectedIds, false)
							table.resetRowSelection()
						}}
					>
						{t('admin.food.bulk_disable')}
					</Button>
					<Button
						size='sm'
						variant='destructive'
						className='rounded-full'
						onClick={() => setConfirmBulkDelete(true)}
					>
						{t('admin.food.delete')}
					</Button>
				</div>
			)}

			{view === 'price' ? (
				<ul className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
					{foods.map(food => (
						<li
							key={food.id}
							className={cn(
								'flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card',
								!food.isAvailable && 'opacity-60'
							)}
						>
							<button
								type='button'
								onClick={() => setEditing(food)}
								className='block aspect-[4/3] w-full bg-muted'
							>
								<StoredImage
									imageKey={food.imageUrl}
									alt={food.name}
									className='size-full object-cover'
									fallback={
										<div className='flex size-full items-center justify-center text-muted-foreground'>
											<UtensilsCrossed className='size-6' />
										</div>
									}
								/>
							</button>
							<div className='flex flex-1 flex-col gap-2 p-3'>
								<div className='flex items-baseline justify-between gap-2'>
									<p className='truncate text-sm font-medium text-foreground'>
										{food.name}
									</p>
									<span className='shrink-0 text-[11px] tabular-nums text-muted-foreground'>
										{food.orderCount}×
									</span>
								</div>
								<div className='mt-auto flex flex-col gap-1.5'>
									{food.variants.map(v => (
										<VariantPriceField
											key={v.id}
											variant={v}
											foodName={food.name}
											showLabel={food.variants.length > 1}
											onCommit={patch => onUpdateVariant(v.id, patch)}
										/>
									))}
								</div>
							</div>
						</li>
					))}
				</ul>
			) : view === 'gallery' ? (
				<ul className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
					{foods.map(food => (
						<li
							key={food.id}
							className={cn(
								'overflow-hidden rounded-2xl border border-border/60 bg-card',
								!food.isAvailable && 'opacity-60'
							)}
						>
							<button
								type='button'
								onClick={() => setEditing(food)}
								className='block aspect-[4/3] w-full bg-muted'
							>
								<StoredImage
									imageKey={food.imageUrl}
									alt={food.name}
									className='size-full object-cover'
									fallback={
										<div className='flex size-full items-center justify-center text-muted-foreground'>
											<UtensilsCrossed className='size-6' />
										</div>
									}
								/>
							</button>
							<div className='px-3 py-2'>
								<p className='truncate text-sm font-medium text-foreground'>
									{food.name}
								</p>
								<p className='flex justify-between gap-2 text-xs text-muted-foreground'>
									<span>
										{!food.isSeasonal && food.price != null && food.price > 0
											? `${food.price} ${food.currency ?? ''}`
											: t('menu.seasonal_price')}
									</span>
									<span>
										{t('admin.food.ordered_count', { count: food.orderCount })}
									</span>
								</p>
							</div>
						</li>
					))}
				</ul>
			) : (
				<DataGrid
					table={table}
					{...dataGridProps}
					onRowAdd={undefined}
					height={520}
					stretchColumns
				/>
			)}

			{editing && (
				<EditFoodDialog
					key={editing.id}
					food={editing}
					categories={categories}
					onSave={next => onDataChange([next])}
					onDelete={() => onDelete(editing.id)}
					onTranslate={() => onTranslate(editing)}
					onClose={() => setEditing(null)}
				/>
			)}

			<ConfirmDialog
				open={confirmBulkDelete}
				onOpenChange={setConfirmBulkDelete}
				title={t('admin.food.bulk_delete_title', { count: selectedIds.length })}
				description={t('admin.food.bulk_delete_desc')}
				confirmLabel={t('admin.food.delete')}
				onConfirm={() => {
					onRowsDelete(selected.map(r => r.original))
					table.resetRowSelection()
					setConfirmBulkDelete(false)
				}}
			/>
		</div>
	)
}
