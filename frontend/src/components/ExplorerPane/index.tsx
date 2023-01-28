import { ActionIcon, Box, Button, Divider, Group, NumberInput, Pagination, ScrollArea, Select, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { mdiArrowLeft, mdiArrowRight, mdiDatabase, mdiRefresh, mdiTableSearch, mdiViewSequential } from "@mdi/js";
import { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent, useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { getSurreal } from "~/surreal";
import { OpenFn } from "~/typings";
import { DataTable } from "../DataTable";
import { Icon } from "../Icon";
import { Panel } from "../Panel";

const PAGE_SIZES = [
	{ label: '10 Results per page', value: '10' },
	{ label: '50 Results per page', value: '50' },
	{ label: '100 Results per page', value: '100' },
	{ label: '250 Results per page', value: '250' }
];

export interface ExplorerPaneProps {
	refreshId: number;
	activeTable: string | null;
	activeRecordId: string | null;
	onSelectRecord: OpenFn;
}

export function ExplorerPane(props: ExplorerPaneProps) {
	const isLight = useIsLight();
	const [records, setRecords] = useImmer<any[]>([]);
	const [recordCount, setRecordCount] = useState(0);
	const [pageText, setPageText] = useInputState('1');
	const [pageSize, setPageSize] = useInputState('50');
	const [page, setPage] = useState(1);

	const pageCount = Math.ceil(recordCount / parseInt(pageSize));

	function setCurrentPage(number: number) {
		setPageText(number.toString());
		setPage(number);
	}

	const fetchRecords = useStable(async () => {
		if (!props.activeTable) {
			setRecords([]);
			return;
		}

		const surreal = getSurreal();

		if (!surreal) {
			return;
		}

		const limitBy = parseInt(pageSize);
		const startAt = (page - 1) * parseInt(pageSize);

		const countQuery = `SELECT count() AS count FROM ${props.activeTable} GROUP BY ALL`;
		const fetchQuery = `SELECT * FROM ${props.activeTable} LIMIT ${limitBy} ${startAt > 0 ? `START ${startAt}` : ''}`;

		const response = await surreal.query(`${countQuery};${fetchQuery}`);
		const resultCount = response[0].result?.[0]?.count || 0;
		const resultRecords = response[1].result || [];

		setRecordCount(resultCount);
		setRecords(resultRecords);

		if (page > pageCount) {
			setCurrentPage(pageCount || 1);
		}
	});

	useEffect(() => {
		fetchRecords();
	}, [props.activeTable, props.refreshId, pageSize, page]);

	const gotoPage = useStable((e: FocusEvent | KeyboardEvent) => {
		if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Enter') {
			return;
		}

		const value = (e.target as HTMLInputElement).value;
		let newPage = new Number(value).valueOf();

		if (!value || isNaN(newPage)) {
			setPageText(page.toString());
			return;
		}

		if (newPage < 1) {
			newPage = 1;
		}

		if (newPage > pageCount) {
			newPage = pageCount;
		}

		setCurrentPage(newPage);
	});

	const previousPage = useStable(() => {
		if (page <= 1) return;

		setCurrentPage(page - 1);
	});

	const nextPage = useStable(() => {
		if (page >= pageCount) return;

		setCurrentPage(page + 1);
	});

	return (
		<Panel
			title="Data Explorer"
			icon={mdiTableSearch}
			rightSection={
				<Group align="center">
					<ActionIcon
						title="Refresh"
						onClick={fetchRecords}
					>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>

					<Divider
						orientation="vertical"
						color={isLight ? 'light.0' : 'dark.5'}
					/>

					<Icon color="light.4" path={mdiDatabase} mr={-10} />
					<Text color="light.4" lineClamp={1}>
						{recordCount || 'no'} rows
					</Text>
				</Group>
			}
		>
			<ScrollArea
				style={{ position: 'absolute', inset: 12, top: 0, bottom: 54 }}
			>
				<DataTable
					data={records}
					openRecord={props.onSelectRecord}
					active={props.activeRecordId}
				/>
			</ScrollArea>

			<Group
				style={{ position: 'absolute', insetInline: 12, bottom: 12 }}
				spacing="xl"
			>
				<Group spacing="xs">
					<Button
						color="dark.5"
						variant="outline"
						c="light.4"
						px="xs"
						onClick={previousPage}
						disabled={page <= 1}
						style={{ opacity: page <= 1 ? 0.4 : 1 }}
					>
						<Icon path={mdiArrowLeft} />
					</Button>
					
					<TextInput
						value={pageText}
						onChange={setPageText}
						maw={46}
						withAsterisk
						onBlur={gotoPage}
						onKeyDown={gotoPage}
						styles={{
							input: {
								textAlign: 'center',
								paddingInline: 0
							}
						}}
					/>

					<Text color="light.3">
						of {pageCount} pages
					</Text>

					<Button
						color="dark.5"
						variant="outline"
						c="light.4"
						px="xs"
						onClick={nextPage}
						disabled={page >= pageCount}
						style={{ opacity: page >= pageCount ? 0.4 : 1 }}
					>
						<Icon path={mdiArrowRight} />
					</Button>
				</Group>

				<Select
					value={pageSize}
					onChange={setPageSize}
					data={PAGE_SIZES}
				/>
			</Group>
		</Panel>
	)
}