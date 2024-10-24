import { ActionIcon, type ComboboxData, Group, Select, TextInput } from "@mantine/core";
import { Text } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { type FocusEvent, type KeyboardEvent, useLayoutEffect } from "react";
import { useStable } from "~/hooks/stable";
import { iconChevronLeft, iconChevronRight } from "~/util/icons";
import { Icon } from "../Icon";
import type { PaginationStore } from "./hook";

const PAGE_SIZES: ComboboxData = [
	{ label: "10 Results per page", value: "10" },
	{ label: "25 Results per page", value: "25" },
	{ label: "50 Results per page", value: "50" },
	{ label: "100 Results per page", value: "100" },
];

export interface PaginationProps {
	store: PaginationStore;
	loading?: boolean;
}

export function Pagination({ store, loading }: PaginationProps) {
	const [customPage, setCustomPage] = useInputState("");

	const gotoPage = useStable((e: FocusEvent | KeyboardEvent) => {
		if (e.type === "keydown" && (e as KeyboardEvent).key !== "Enter") {
			return;
		}

		const entered = Number.parseInt(customPage);

		store.setCurrentPage(entered);
		setCustomPage(store.clampPage(entered).toString());
	});

	useLayoutEffect(() => {
		setCustomPage(store.currentPage.toString());
	}, [store.currentPage]);

	return (
		<>
			<Group
				gap="xs"
				wrap="nowrap"
			>
				<ActionIcon
					onClick={store.previousPage}
					disabled={store.currentPage <= 1}
					loading={loading}
					aria-label="Previous page"
				>
					<Icon path={iconChevronLeft} />
				</ActionIcon>

				<TextInput
					value={customPage}
					spellCheck={false}
					onChange={setCustomPage}
					maw={36}
					size="xs"
					withAsterisk
					onBlur={gotoPage}
					onKeyDown={gotoPage}
					disabled={loading}
					styles={{
						input: {
							textAlign: "center",
							paddingInline: 0,
						},
					}}
				/>

				<Text c="slate">of {store.pageCount} pages</Text>

				<ActionIcon
					onClick={store.nextPage}
					disabled={store.currentPage >= store.pageCount}
					loading={loading}
					aria-label="Next page"
				>
					<Icon path={iconChevronRight} />
				</ActionIcon>
			</Group>

			<Select
				value={store.pageSize.toString()}
				onChange={(v) => store.setPageSize(Number.parseInt(v ?? "0"))}
				data={PAGE_SIZES}
				size="xs"
			/>
		</>
	);
}
