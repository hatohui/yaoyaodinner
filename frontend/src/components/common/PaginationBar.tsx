import type { ReactNode } from 'react'
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

	const pageSelect = (
		trigger: ReactNode,
		triggerClass: string,
		ariaLabel?: string
	) => (
		<Select
			value={page.toString()}
			onValueChange={val => handlePageChange(Number(val))}
		>
			<SelectTrigger aria-label={ariaLabel} className={triggerClass}>
				{trigger}
			</SelectTrigger>
			<SelectContent>
				{Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
					<SelectItem key={n} value={n.toString()}>
						{n}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)

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
									'size-8 cursor-pointer rounded-full border border-border bg-card p-0 text-xs font-medium text-foreground shadow-xs transition-colors has-[>svg]:px-0 hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-auto sm:px-2.5 sm:text-sm sm:has-[>svg]:px-2.5',
									!canGoPrevious && 'pointer-events-none opacity-45'
								)}
							/>
						</PaginationItem>

						{getPageNumbers().map((pageNum, idx) =>
							pageNum === 'ellipsis' ? (
								<PaginationItem key={`ellipsis-${idx}`}>
									{pageSelect(
										<PaginationEllipsis className='size-full' />,
										'size-7 justify-center gap-0 rounded-full border-none bg-transparent p-0 text-muted-foreground shadow-none hover:bg-primary/10 hover:text-primary data-[size=default]:h-7 dark:bg-transparent dark:hover:bg-primary/10 sm:size-9 sm:data-[size=default]:h-9 [&>svg]:hidden',
										'Jump to page'
									)}
								</PaginationItem>
							) : pageNum === page ? (
								<PaginationItem key={pageNum}>
									{pageSelect(
										<SelectValue />,
										cn(
											'size-8 justify-center gap-0 rounded-full border-primary bg-primary p-0 text-xs font-semibold text-primary-foreground shadow-sm data-[size=default]:h-8 sm:size-9 sm:text-sm sm:data-[size=default]:h-9 [&>svg]:hidden',
											'cursor-pointer transition-colors hover:bg-primary/90',
											// the select's own dark:bg-input/30 would otherwise win in dark mode
											'dark:bg-primary dark:hover:bg-primary/90'
										)
									)}
								</PaginationItem>
							) : (
								<PaginationItem key={pageNum}>
									<PaginationLink
										onClick={() => handlePageChange(pageNum)}
										className='size-8 cursor-pointer rounded-full border border-border bg-card text-xs font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:size-9 sm:text-sm'
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
									'size-8 cursor-pointer rounded-full border border-border bg-card p-0 text-xs font-medium text-foreground shadow-xs transition-colors has-[>svg]:px-0 hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-auto sm:px-2.5 sm:text-sm sm:has-[>svg]:px-2.5',
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
