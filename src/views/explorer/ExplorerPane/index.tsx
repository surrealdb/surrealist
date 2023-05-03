import { ActionIcon, Button, Center, Divider, Group, ScrollArea, Select, Text, TextInput } from "@mantine/core";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { mdiArrowLeft, mdiArrowRight, mdiDatabase, mdiFilterVariant, mdiPlus, mdiRefresh, mdiTable } from "@mdi/js";
import { FocusEvent, KeyboardEvent, useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { adapter } from "~/adapter";
import { DataTable } from "~/components/DataTable";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { getSurreal } from "~/surreal";
import { ColumnSort, OpenFn } from "~/typings";

const PAGE_SIZES = [
	{ label: '10 Results per page', value: '10' },
	{ label: '25 Results per page', value: '25' },
	{ label: '50 Results per page', value: '50' },
	{ label: '100 Results per page', value: '100' },
];

export interface ExplorerPaneProps {
	refreshId: number;
	activeTable: string | null;
	activeRecordId: string | null;
	onSelectRecord: OpenFn;
	onRequestCreate: () => void;
}

export function ExplorerPane(props: ExplorerPaneProps) {
	const isLight = useIsLight();
	const [records, setRecords] = useImmer<any[]>([]);
	const [recordCount, setRecordCount] = useState(0);
	const [filterValid, setFilterValid] = useState(false);
	const [filter, setFilter] = useState(false);
	const [filterText, setFilterText] = useInputState('');
	const [pageText, setPageText] = useInputState('1');
	const [pageSize, setPageSize] = useInputState('25');
	const [sortMode, setSortMode] = useState<ColumnSort | null>(null);
	const [page, setPage] = useState(1);

	const pageCount = Math.ceil(recordCount / parseInt(pageSize));

	function setCurrentPage(number: number) {
		setPageText(number.toString());
		setPage(number);
	}

	const toggleFilter = useStable(() => {
		setFilter(!filter);
	});

	const [showFilter] = useDebouncedValue(filter, 250);
	const [filterClause] = useDebouncedValue(filterText, 500);

	const fetchRecords = useStable(async () => {
		if (!props.activeTable) {
			setRecords([]);
			return;
		}

		const surreal = getSurreal();

		if (!surreal || !filterValid) {
			return;
		}

		const limitBy = parseInt(pageSize);
		const startAt = (page - 1) * parseInt(pageSize);
		const [sortCol, sortDir] = sortMode || ['id', 'asc'];

		let countQuery = `SELECT * FROM count((SELECT * FROM ${props.activeTable}`;
		let fetchQuery = `SELECT * FROM ${props.activeTable}`;
 
		if (showFilter && filterClause) {
			countQuery += ` WHERE ${filterClause}`;
			fetchQuery += ` WHERE ${filterClause}`;
		}

		countQuery += '))';
		fetchQuery += ` ORDER BY ${sortCol} ${sortDir} LIMIT ${limitBy}`;

		if (startAt > 0) {
			fetchQuery += ` START ${startAt}`;
		}

		const response = await surreal.query(`${countQuery};${fetchQuery}`);
		const resultCount = response[0].result?.[0] || 0;
		const resultRecords = response[1].result || [];

		setRecordCount(resultCount);
		setRecords(resultRecords);

		if (page > pageCount) {
			setCurrentPage(pageCount || 1);
		}
	});

	useEffect(() => {
		fetchRecords();
	}, [props.activeTable, props.refreshId, pageSize, page, sortMode, showFilter, filterClause]);

	useEffect(() => {
		if (showFilter && filterText) {
			adapter.validateWhereClause(filterText).then(isValid => {
				setFilterValid(isValid);
			});
		} else {
			setFilterValid(true);
		}
	}, [showFilter, filterText]);

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

	const handleOpenRow = useStable((record: any) => {
		props.onSelectRecord(record.id);
	});

	return (
		<Panel
			title="Record Explorer"
			icon={mdiTable}
			rightSection={
				<Group align="center">
					<ActionIcon
						title="Create record"
						onClick={props.onRequestCreate}
					>
						<Icon color="light.4" path={mdiPlus} />
					</ActionIcon>

					<ActionIcon
						title="Refresh"
						onClick={fetchRecords}
					>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>

					<ActionIcon
						title="Toggle filter"
						onClick={toggleFilter}
					>
						<Icon color="light.4" path={mdiFilterVariant} />
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
			{props.activeTable ? (
				<>
					{filter && (
						<TextInput
							placeholder="Enter filter clause..."
							icon={<Icon path={mdiFilterVariant} />}
							value={filterText}
							onChange={setFilterText}
							error={!filterValid}
							autoFocus
							styles={theme => ({
								input: {
									fontFamily: 'JetBrains Mono',
									borderColor: (filterValid ? theme.fn.themeColor('gray') : theme.fn.themeColor('red')) + ' !important'
								}
							})}
						/>
					)}
					{records.length > 0 ? (
						<ScrollArea
							style={{ position: 'absolute', inset: 12, top: filter ? 40 : 0, bottom: 54, transition: 'top .1s' }}
						>
							<DataTable
								data={records}
								openRecord={props.onSelectRecord}
								active={props.activeRecordId}
								sorting={sortMode}
								onSortingChange={setSortMode}
								onRowClick={handleOpenRow}
							/>
						</ScrollArea>
					) : (
						<Center h="90%" c="light.5">
							Table has no records
						</Center>
					)}

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
				</>
			) : (
				<Center h="100%" c="light.5">
					Select a table to view its records
				</Center>
			)}
		</Panel>
	)
}