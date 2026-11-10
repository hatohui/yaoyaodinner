import { useTranslation } from 'react-i18next'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import { SearchBar } from '@/components/common/SearchBar'
import { PaginationBar } from '@/components/common/PaginationBar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { CreateFoodDialog } from './@CreateFoodDialog'
import { AdminFoodViewToggle, FoodTable, useAdminFoodView } from './@FoodTable'
import { useFoodCatalog, type AdminFoodSort } from './@useFoodCatalog'
import { ManualTranslationDialog } from '@/components/common/ManualTranslationDialog'

const SORTS: { value: AdminFoodSort; key: string }[] = [
	{ value: 'name_asc', key: 'tables.sort.name_asc' },
	{ value: 'name_desc', key: 'tables.sort.name_desc' },
	{ value: 'most_ordered', key: 'tables.sort.most_ordered' },
	{ value: 'least_ordered', key: 'tables.sort.least_ordered' },
	{ value: 'price_asc', key: 'menu.sort_price' },
	{ value: 'price_desc', key: 'menu.sort_price_desc' },
]

export default function AdminFoodPage() {
	const { t } = useTranslation()
	const { view, setView } = useAdminFoodView()
	const {
		search,
		setSearch,
		categoryId,
		setCategoryId,
		sort,
		setSort,
		categories,
		pagination,
		foods,
		isLoading,
		creating,
		createFood,
		onDataChange,
		updateVariant,
		deleteFood,
		bulkToggle,
		bulkDelete,
		failedTranslationFood,
		setFailedTranslationFood,
		handleSaveTranslations,
	} = useFoodCatalog()

	const activeSortKey =
		SORTS.find(s => s.value === sort)?.key ?? 'tables.sort.name_asc'

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.food.title')}
				</h1>
				<CreateFoodDialog
					categories={categories}
					pending={creating}
					onCreate={createFood}
				/>
			</div>

			<div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
				<SearchBar
					value={search}
					onChange={setSearch}
					placeholder={t('menu.search_placeholder')}
					className='w-full sm:flex-1'
				/>
				<div className='flex items-center gap-2'>
					<Select value={categoryId} onValueChange={setCategoryId}>
						<SelectTrigger className='min-w-0 flex-1 rounded-full border-border bg-card font-medium text-foreground shadow-sm hover:border-primary/50 sm:w-40 sm:flex-none'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>{t('menu.all_categories')}</SelectItem>
							{categories.map(c => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<button
								type='button'
								aria-label={t('tables.sort.label')}
								title={t(activeSortKey as 'tables.sort.name_asc')}
								className='flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10'
							>
								<ArrowUpDown className='size-3.5 text-primary' />
								<span className='hidden sm:inline'>
									{t(activeSortKey as 'tables.sort.name_asc')}
								</span>
								<ChevronDown className='size-3.5 text-muted-foreground' />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuRadioGroup
								value={sort}
								onValueChange={v => setSort(v as AdminFoodSort)}
							>
								{SORTS.map(item => (
									<DropdownMenuRadioItem key={item.value} value={item.value}>
										{t(item.key as 'tables.sort.name_asc')}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					<AdminFoodViewToggle view={view} onChange={setView} />
				</div>
			</div>

			<FoodTable
				view={view}
				foods={foods}
				categories={categories}
				isLoading={isLoading}
				onDataChange={onDataChange}
				onUpdateVariant={updateVariant}
				onDelete={deleteFood}
				onBulkToggle={bulkToggle}
				onBulkDelete={bulkDelete}
				onTranslate={food =>
					setFailedTranslationFood({
						id: food.id,
						name: food.name,
						manual: true,
					})
				}
			/>

			<div className='flex justify-center'>
				<PaginationBar pagination={pagination} />
			</div>

			<ManualTranslationDialog
				open={!!failedTranslationFood}
				onOpenChange={open => {
					if (!open) setFailedTranslationFood(null)
				}}
				sourceName={failedTranslationFood?.name ?? ''}
				title={
					failedTranslationFood?.manual
						? t('admin.food.translations')
						: undefined
				}
				onSave={handleSaveTranslations}
			/>
		</div>
	)
}
