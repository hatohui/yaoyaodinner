import type { usePagination } from '@/hooks/usePagination'
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
import { useTranslation } from 'react-i18next'
import { MENU_PAGE_SIZE_ALL, MENU_PAGE_SIZE_OPTIONS } from '@/common/constants'
import { cn } from '@/utils/shadcn'

interface PaginationBarProps {
	pagination: ReturnType<typeof usePagination>
	showPageSize?: boolean
}

export function PaginationBar({
	pagination,
	showPageSize,
}: PaginationBarProps) {
	const { t } = useTranslation()
	const {
		page,
		getPageNumbers,
		handlePageChange,
		goToNextPage,
		goToPreviousPage,
		canGoNext,
		canGoPrevious,
		totalPages,
		count,
		setCount,
	} = pagination

	if (totalPages <= 1 && !showPageSize) return null

	return (
		<div className='flex flex-wrap items-center justify-center gap-4'>
			{totalPages > 1 && (
				<Pagination>
					<PaginationContent className='flex-wrap gap-1'>
						<PaginationItem>
							<PaginationPrevious
								onClick={goToPreviousPage}
								aria-disabled={!canGoPrevious}
								className={cn(
									'cursor-pointer rounded-full bg-muted/60 transition-colors hover:bg-muted',
									!canGoPrevious && 'pointer-events-none opacity-40'
								)}
							/>
						</PaginationItem>

						{getPageNumbers().map((pageNum, idx) =>
							pageNum === 'ellipsis' ? (
								<PaginationItem
									key={`ellipsis-${idx}`}
									className='hidden sm:block'
								>
									<PaginationEllipsis />
								</PaginationItem>
							) : pageNum === page ? (
								<PaginationItem key={pageNum}>
									<Select
										value={page.toString()}
										onValueChange={val => handlePageChange(Number(val))}
									>
										<SelectTrigger
											className={cn(
												'h-9 w-9 justify-center gap-0 rounded-full border-primary bg-primary p-0 text-sm font-medium text-primary-foreground [&>svg]:hidden',
												'cursor-pointer transition-colors hover:bg-primary/90'
											)}
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Array.from({ length: totalPages }, (_, i) => i + 1).map(
												n => (
													<SelectItem key={n} value={n.toString()}>
														{n}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</PaginationItem>
							) : (
								<PaginationItem key={pageNum} className='hidden sm:block'>
									<PaginationLink
										onClick={() => handlePageChange(pageNum)}
										className='cursor-pointer rounded-full bg-muted/60 transition-colors hover:bg-muted'
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
								className={cn(
									'cursor-pointer rounded-full bg-muted/60 transition-colors hover:bg-muted',
									!canGoNext && 'pointer-events-none opacity-40'
								)}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	)
}
