import { useState, useMemo, useCallback, useEffect } from 'react'

interface UsePaginationOptions {
	initialPage?: number
	initialCount?: number
	total?: number
	onPageChange?: (page: number) => void
	onCountChange?: (count: number) => void
}

export function usePagination(options: UsePaginationOptions = {}) {
	const {
		initialPage = 1,
		initialCount = 20,
		total = 0,
		onPageChange,
		onCountChange,
	} = options

	const [page, setPageInternal] = useState(initialPage)
	const [count, setCountInternal] = useState(initialCount)

	useEffect(() => {
		setPageInternal(initialPage)
	}, [initialPage])

	useEffect(() => {
		setCountInternal(initialCount)
	}, [initialCount])

	const totalPages = useMemo(() => {
		return total > 0 ? Math.ceil(total / count) : 0
	}, [total, count])

	const setPage = useCallback(
		(newPage: number) => {
			setPageInternal(newPage)
			onPageChange?.(newPage)
		},
		[onPageChange]
	)

	useEffect(() => {
		if (page > totalPages && totalPages > 0) {
			setPage(1)
		}
	}, [page, totalPages, setPage])

	const setCount = useCallback(
		(newCount: number) => {
			setCountInternal(newCount)
			onCountChange?.(newCount)
		},
		[onCountChange]
	)

	const getPageNumbers = useCallback(() => {
		const pages: (number | 'ellipsis')[] = []
		const showPages = 5

		if (totalPages <= showPages) {
			return Array.from({ length: totalPages }, (_, i) => i + 1)
		}

		pages.push(1)

		if (page > 3) {
			pages.push('ellipsis')
		}

		const start = Math.max(2, page - 1)
		const end = Math.min(totalPages - 1, page + 1)

		for (let i = start; i <= end; i++) {
			if (!pages.includes(i)) {
				pages.push(i)
			}
		}

		if (page < totalPages - 2) {
			pages.push('ellipsis')
		}

		if (!pages.includes(totalPages)) {
			pages.push(totalPages)
		}

		return pages
	}, [page, totalPages])

	const handlePageChange = useCallback(
		(newPage: number) => {
			if (newPage >= 1 && newPage <= totalPages) {
				setPage(newPage)
				window.scrollTo({ top: 0, behavior: 'smooth' })
			}
		},
		[totalPages, setPage]
	)

	const goToNextPage = useCallback(() => {
		handlePageChange(page + 1)
	}, [page, handlePageChange])

	const goToPreviousPage = useCallback(() => {
		handlePageChange(page - 1)
	}, [page, handlePageChange])

	return {
		page,
		setPage,
		count,
		setCount,
		totalPages,
		getPageNumbers,
		handlePageChange,
		goToNextPage,
		goToPreviousPage,
		canGoNext: page < totalPages,
		canGoPrevious: page > 1,
	}
}
