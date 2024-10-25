import { useState } from "react";
import { useStable } from "~/hooks/stable";

export interface PaginationStore {
	total: number;
	currentPage: number;
	pageSize: number;
	pageCount: number;
	clampPage: (page: number) => number;
	setTotal: (total: number) => void;
	setCurrentPage: (page: number) => void;
	setPageSize: (size: number) => void;
	previousPage: () => void;
	nextPage: () => void;
}

export function usePagination(): PaginationStore {
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const pageCount = Math.ceil(total / pageSize);

	const previousPage = useStable(() => {
		const newPage = Math.max(1, currentPage - 1);

		setCurrentPage(newPage);
	});

	const nextPage = useStable(() => {
		const newPage = Math.min(pageCount, currentPage + 1);

		setCurrentPage(newPage);
	});

	const clampPage = useStable((page: number) => {
		if (Number.isNaN(page)) {
			return 1;
		}

		return Math.min(Math.max(1, page), pageCount);
	});

	const updateCurrentPage = useStable((page: number) => {
		setCurrentPage(clampPage(page));
	});

	const updatePageSize = useStable((size: number) => {
		setPageSize(size);
		setCurrentPage(1);
	});

	return {
		total,
		currentPage,
		pageSize,
		pageCount,
		clampPage,
		setTotal,
		setCurrentPage: updateCurrentPage,
		setPageSize: updatePageSize,
		previousPage,
		nextPage,
	};
}
