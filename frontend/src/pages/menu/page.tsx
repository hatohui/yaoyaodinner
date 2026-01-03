import { useTranslation } from 'react-i18next'
import { useFoods } from '@/hooks/food/useFoods'
import { usePagination } from '@/hooks/usePagination'
import { useMenuSearchParams } from '@/utils/searchParams'
import { FoodCard } from './@FoodCard'
import { LoadingView, LoadingSpinner } from './@LoadingView'
import { ErrorView } from './@ErrorView'
import { EmptyView } from './@EmptyView'
import Container from '@/components/common/Container'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationEllipsis,
} from '@/components/ui/pagination'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { Food } from '@/types/models/Food'

export default function MenuPage() {
	const { i18n } = useTranslation()

	// Get search params from URL
	const {
		page: urlPage,
		count: urlCount,
		category,
		setPage: setUrlPage,
		setCount: setUrlCount,
	} = useMenuSearchParams()

	const {
		page,
		count,
		setCount,
		totalPages,
		getPageNumbers,
		handlePageChange,
		goToNextPage,
		goToPreviousPage,
		canGoNext,
		canGoPrevious,
	} = usePagination({
		initialPage: urlPage,
		initialCount: urlCount,
		onPageChange: setUrlPage,
		onCountChange: setUrlCount,
	})

	const { data, isLoading, isError, error, refetch } = useFoods({
		lang: i18n.language,
		page,
		count,
		category,
	})

	const actualTotalPages = data ? Math.ceil(data.total / count) : totalPages

	if (isLoading && !data) {
		return (
			<Container>
				<div className='py-8'>
					<LoadingView />
				</div>
			</Container>
		)
	}

	if (isError && error) {
		return (
			<Container>
				<div className='py-8'>
					<ErrorView error={error} onRetry={() => refetch()} />
				</div>
			</Container>
		)
	}

	return (
		<Container>
			<div className='space-y-8 py-8'>
				{/* Header */}
				<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<div>
						<h1 className='text-3xl font-bold tracking-tight'>Menu</h1>
						<p className='text-muted-foreground'>
							Browse our delicious selection of dishes
							{data && ` (${data.total} items)`}
						</p>
					</div>

					<div className='flex items-center gap-4'>
						{/* Items per page */}
						<div className='flex items-center gap-2'>
							<Label htmlFor='count' className='whitespace-nowrap text-sm'>
								Per page:
							</Label>
							<Select
								value={count.toString()}
								onValueChange={val => setCount(Number(val))}
							>
								<SelectTrigger id='count' className='w-20'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='10'>10</SelectItem>
									<SelectItem value='20'>20</SelectItem>
									<SelectItem value='50'>50</SelectItem>
									<SelectItem value='100'>100</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Content */}
				{isLoading ? (
					<LoadingSpinner />
				) : !data?.foods || data.foods.length === 0 ? (
					<EmptyView />
				) : (
					<>
						{/* Food Grid */}
						<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
							{data.foods.map((food: Food) => (
								<FoodCard key={food.id} food={food} />
							))}
						</div>

						{/* Pagination */}
						{actualTotalPages > 1 && (
							<div className='flex justify-center'>
								<Pagination>
									<PaginationContent>
										<PaginationItem>
											<PaginationPrevious
												onClick={goToPreviousPage}
												aria-disabled={!canGoPrevious}
												className={
													!canGoPrevious
														? 'pointer-events-none opacity-50'
														: 'cursor-pointer'
												}
											/>
										</PaginationItem>

										{getPageNumbers().map((pageNum, idx) =>
											pageNum === 'ellipsis' ? (
												<PaginationItem key={`ellipsis-${idx}`}>
													<PaginationEllipsis />
												</PaginationItem>
											) : (
												<PaginationItem key={pageNum}>
													<PaginationLink
														onClick={() => handlePageChange(pageNum)}
														isActive={page === pageNum}
														className='cursor-pointer'
													>
														{pageNum}
													</PaginationLink>
												</PaginationItem>
											)
										)}

										<PaginationItem>
											<PaginationNext
												onClick={goToNextPage}
												aria-disabled={!canGoNext}
												className={
													!canGoNext
														? 'pointer-events-none opacity-50'
														: 'cursor-pointer'
												}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							</div>
						)}

						{/* Page Info */}
						<div className='text-center text-sm text-muted-foreground'>
							Showing {(page - 1) * count + 1} to{' '}
							{Math.min(page * count, data.total)} of {data.total} items
						</div>
					</>
				)}
			</div>
		</Container>
	)
}
