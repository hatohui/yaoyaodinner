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
import { cn } from '@/utils/shadcn'

interface PaginationBarProps {
	pagination: ReturnType<typeof usePagination>
	showPageSize?: boolean
}

export function PaginationBar({
	pagination,
	showPageSize,
}: PaginationBarProps) {
	const {
		page,
		getPageNumbers,
		handlePageChange,
		goToNextPage,
		goToPreviousPage,
		canGoNext,
		canGoPrevious,
		totalPages,
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
									'cursor-pointer rounded-full border border-border bg-card font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary',
									!canGoPrevious && 'pointer-events-none opacity-45'
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
												'h-9 w-9 justify-center gap-0 rounded-full border-primary bg-primary p-0 text-sm font-semibold text-primary-foreground shadow-sm [&>svg]:hidden',
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
										className='cursor-pointer rounded-full border border-border bg-card font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
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
									'cursor-pointer rounded-full border border-border bg-card font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary',
									!canGoNext && 'pointer-events-none opacity-45'
								)}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	)
}
