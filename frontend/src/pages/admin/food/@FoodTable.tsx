import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { CategoryItemDto } from '@/api/model'
import type { FoodGridRow } from './@useFoodCatalog'
import { DataGrid } from '@/components/data-grid/data-grid'
import { getDataGridSelectColumn } from '@/components/data-grid/data-grid-select-column'
import { useDataGrid } from '@/hooks/use-data-grid'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LayoutGrid, Table2, UtensilsCrossed } from 'lucide-react'
import { StoredImage } from '@/components/common/StoredImage'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EditFoodDialog } from './@EditFoodDialog'
import { cn } from '@/utils/shadcn'
import { localStorage } from '@/utils/localstorage'
import { ADMIN_FOOD_VIEW_STORAGE_KEY } from '@/common/constants'

interface FoodTableProps {
	foods: FoodGridRow[]
	categories: CategoryItemDto[]
	isLoading: boolean
	onDataChange: (updated: FoodGridRow[]) => void
	onDelete: (id: string) => void
	onBulkToggle: (ids: string[], isAvailable: boolean) => void
	onBulkDelete: (ids: string[]) => void
	onTranslate: (food: FoodGridRow) => void
}

export function FoodTable({
	foods,
	categories,
	isLoading,
	onDataChange,
	onDelete,
	onBulkToggle,
	onBulkDelete,
	onTranslate,
}: FoodTableProps) {
	const { t } = useTranslation()
	const [gallery, setGalleryState] = React.useState(
		() => localStorage.load(ADMIN_FOOD_VIEW_STORAGE_KEY) === 'gallery'
	)
	const setGallery = (next: boolean) => {
		localStorage.save(ADMIN_FOOD_VIEW_STORAGE_KEY, next ? 'gallery' : 'table')
		setGalleryState(next)
	}
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
		return (
			<div className='flex justify-center py-16'>
				<Spinner />
			</div>
		)
	}

	if (foods.length === 0) {
		return (
			<p className='py-16 text-center text-sm text-muted-foreground'>
				{t('admin.food.empty')}
			</p>
		)
	}

	const viewButton = (
		active: boolean,
		label: string,
		icon: React.ReactNode,
		onClick: () => void
	) => (
		<Button
			size='icon-sm'
			variant={active ? 'default' : 'outline'}
			className='rounded-full'
			aria-label={label}
			aria-pressed={active}
			onClick={onClick}
		>
			{icon}
		</Button>
	)

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex flex-wrap items-center gap-2'>
				<div className='flex gap-1.5'>
					{viewButton(!gallery, t('admin.food.view_table'), <Table2 />, () =>
						setGallery(false)
					)}
					{viewButton(
						gallery,
						t('admin.food.view_gallery'),
						<LayoutGrid />,
						() => setGallery(true)
					)}
				</div>
				{!gallery && selectedIds.length > 0 && (
					<>
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
					</>
				)}
			</div>

			{gallery ? (
				<ul className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
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
								<p className='text-xs text-muted-foreground'>
									{food.price != null && `${food.price} ${food.currency ?? ''}`}
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
