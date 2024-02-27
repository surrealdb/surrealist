import { ColumnSort } from "~/types";
import { create } from 'zustand';

export interface ActiveRecord {
	exists: boolean;
	content: any;
	inputs: [];
	outputs: [];
	initial: string;
}

export type ExplorerStore = {
	activeTable: string | null,
	records: unknown[],
	recordCount: number,
	filtering: boolean,
	filter: string,
	isEditing: boolean,
	recordHistory: string[],
	activeRecord: ActiveRecord | null,
	inspectorId: string,
	inspectorQuery: string,
	pageText: string,
	pageSize: string,
	sortMode: ColumnSort | null,
	page: number,

	setExplorerTable: (activeTable: string | null) => void,
	setExplorerData: (records: unknown[], recordCount: number) => void;
	clearExplorerData: () => void;
	setExplorerFiltering: (filtering: boolean) => void;
	setExplorerFilter: (filter: string) => void;
	openEditor: () => void;
	closeEditor: () => void;
	setHistory: (recordHistory: string[]) => void;
	setActiveRecord: (activeRecord: ActiveRecord | null) => void;
	setInspectorId: (inspectorId: string) => void;
	setInspectorQuery: (inspectorQuery: string) => void;
	updatePageText: (pageText: string) => void;
	updatePageSize: (pageSize: string) => void;
	updateSortMode: (sortMode: ColumnSort | null) => void;
	updatePage: (page: number) => void;
};

export const useExplorerStore = create<ExplorerStore>((set) => ({
	activeTable: null,
	records: [],
	recordCount: 0,
	filtering: false,
	filter: '',
	isEditing: false,
	recordHistory: [],
	activeRecord: null,
	inspectorId: '',
	inspectorQuery: '',
	pageText: '1',
	pageSize: '25',
	sortMode: null,
	page: 1,

	setExplorerTable: (activeTable) => set(() => ({
		activeTable,
		page: 1,
		pageText: '1'
	})),

	setExplorerData: (records, recordCount) => set(() => ({ records, recordCount })),
	clearExplorerData: () => set(() => ({
		records: [],
		recordCount: 0,
	})),

	setExplorerFiltering: (filtering) => set(() => ({ filtering })),
	setExplorerFilter: (filter: string) => set(() => ({ filter })),

	openEditor: () => set(() => ({
		isEditing: true,
		isCreating: false,
	})),

	closeEditor: () => set(() => ({
		isCreating: false,
		isEditing: false,
		activeRecord: null,
		recordHistory: [],
		inspectorId: '',
		inspectorQuery: '',
	})),

	setHistory: (recordHistory) => set(() => ({ recordHistory })),
	setActiveRecord: (activeRecord) => set(() => ({ activeRecord })),
	setInspectorId: (inspectorId) => set(() => ({ inspectorId })),
	setInspectorQuery: (inspectorQuery) => set(() => ({ inspectorQuery })),
	updatePageText: (pageText) => set(() => ({ pageText })),
	updatePageSize: (pageSize) => set(() => ({ pageSize })),
	updateSortMode: (sortMode) => set(() => ({ sortMode })),
	updatePage: (page) => set(() => ({ page })),

}));