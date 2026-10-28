import { useTranslation } from 'react-i18next'
import { ArrowUpDown } from 'lucide-react'
import { SearchBar } from '@/components/common/SearchBar'
import { PaginationBar } from '@/components/common/PaginationBar'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { CreateFoodDialog } from './@CreateFoodDialog'
import { FoodTable } from './@FoodTable'
import { useFoodCatalog, type AdminFoodSort } from './@useFoodCatalog'
import { ManualTranslationDialog } from '@/components/common/ManualTranslationDialog'

export default function AdminFoodPage() {
	const { t } = useTranslation()
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
		deleteFood,
		bulkToggle,
		bulkDelete,
		failedTranslationFood,
		setFailedTranslationFood,
		handleSaveTranslations,
	} = useFoodCatalog()

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

			<div className='flex flex-wrap items-center gap-2'>
				<SearchBar
					value={search}
					onChange={setSearch}
					placeholder={t('menu.search_placeholder')}
					className='flex-1'
				/>
				<Select value={categoryId} onValueChange={setCategoryId}>
					<SelectTrigger className='rounded-full border-border/80 bg-card font-medium text-foreground shadow-sm hover:border-primary/50'>
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
				<Select
					value={sort}
					onValueChange={val => setSort(val as AdminFoodSort)}
				>
					<SelectTrigger className='rounded-full border-border/80 bg-card font-medium text-foreground shadow-sm hover:border-primary/50'>
						<ArrowUpDown className='size-3.5 shrink-0 text-primary' />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='name_asc'>
							{t('tables.sort.name_asc')}
						</SelectItem>
						<SelectItem value='name_desc'>
							{t('tables.sort.name_desc')}
						</SelectItem>
						<SelectItem value='most_ordered'>
							{t('tables.sort.most_ordered')}
						</SelectItem>
						<SelectItem value='least_ordered'>
							{t('tables.sort.least_ordered')}
						</SelectItem>
						<SelectItem value='price_asc'>{t('menu.sort_price')}</SelectItem>
						<SelectItem value='price_desc'>
							{t('menu.sort_price_desc')}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<FoodTable
				foods={foods}
				categories={categories}
				isLoading={isLoading}
				onDataChange={onDataChange}
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
