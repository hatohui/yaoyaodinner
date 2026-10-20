import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { CategoryItemDto, PresetMenuItemDto } from '@/api/model'
import { DataGrid } from '@/components/data-grid/data-grid'
import { getDataGridSelectColumn } from '@/components/data-grid/data-grid-select-column'
import { useDataGrid } from '@/hooks/use-data-grid'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AddPresetItemDialog } from './@AddPresetItemDialog'

interface PresetItemsGridProps {
	presetId: string
	items: PresetMenuItemDto[]
	isLoading: boolean
	lang: string
	onDataChange: (updated: PresetMenuItemDto[]) => void
	onRemoveItems: (variantIds: string[]) => void
	onAddItem: (variantId: string) => void
	categories: CategoryItemDto[]
	creatingFood: boolean
	onCreateFood: (
		name: string,
		categoryId: string,
		price: number,
		imageUrl?: string
	) => void
}

export function PresetItemsGrid({
	presetId,
	items,
	isLoading,
	lang,
	onDataChange,
	onRemoveItems,
	onAddItem,
	categories,
	creatingFood,
	onCreateFood,
}: PresetItemsGridProps) {
	const { t } = useTranslation()

	const columns = React.useMemo<ColumnDef<PresetMenuItemDto>[]>(
		() => [
			getDataGridSelectColumn<PresetMenuItemDto>(),
			{
				id: 'foodName',
				accessorKey: 'foodName',
				header: t('admin.presets.col_food'),
				size: 200,
				meta: { cell: { variant: 'short-text' } },
			},
			{
				id: 'quantity',
				accessorKey: 'quantity',
				header: t('admin.presets.col_qty'),
				size: 100,
				meta: {
					cell: { variant: 'number', min: 1, step: 1 },
				},
			},
		],
		[t]
	)

	const onRowsDelete = React.useCallback(
		(rows: PresetMenuItemDto[]) => {
			onRemoveItems(rows.map(r => r.variantId))
		},
		[onRemoveItems]
	)

	const { table, ...dataGridProps } = useDataGrid({
		data: items,
		columns,
		onDataChange,
		onRowsDelete,
		getRowId: row => row.variantId,
	})

	if (isLoading) {
		return (
			<div className='flex justify-center py-16'>
				<Spinner />
			</div>
		)
	}

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex justify-end'>
				<AddPresetItemDialog
					trigger={
						<Button size='sm' className='gap-1.5 rounded-full'>
							<Plus data-icon='inline-start' />
							{t('admin.presets.add_item')}
						</Button>
					}
					existingItems={items}
					lang={lang}
					onAdd={onAddItem}
					categories={categories}
					creatingFood={creatingFood}
					onCreateFood={onCreateFood}
				/>
			</div>

			{items.length === 0 ? (
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('admin.presets.items_empty')}
				</p>
			) : (
				<DataGrid
					table={table}
					{...dataGridProps}
					onRowAdd={undefined}
					height={480}
					stretchColumns
				/>
			)}
		</div>
	)
}
