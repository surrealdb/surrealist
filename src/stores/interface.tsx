import { ColorScheme } from "@mantine/core";
import { TabCreation } from "~/types";
import { create } from "zustand";

export type InterfaceStore = {
	nativeTheme: ColorScheme,
	availableUpdate: string,
	showAvailableUpdate: boolean,
	showTabCreator: boolean,
	tabCreation: TabCreation | null,
	showTabEditor: boolean,
	editingId: string,

	setNativeTheme: (nativeTheme: ColorScheme) => void;
	setAvailableUpdate: (availableUpdate: string) => void;
	hideAvailableUpdate: () => void;
	openTabCreator: (tabCreation: TabCreation) => void;
	closeTabCreator: () => void;
	openTabEditor: (editingId: string) => void;
	closeTabEditor: () => void;
};

export const useInterfaceStore = create<InterfaceStore>((set) => ({
	nativeTheme: "light",
	availableUpdate: "",
	showAvailableUpdate: false,
	showTabCreator: false,
	tabCreation: null,
	showTabEditor: false,
	editingId: "",

	setNativeTheme: (nativeTheme) => set(() => ({ nativeTheme })),
	setAvailableUpdate: (availableUpdate) => set(() => ({
		availableUpdate,
		showAvailableUpdate: true,
	})),

	hideAvailableUpdate: () => set(() => ({
		showAvailableUpdate: false,
	})),

	openTabCreator: (tabCreation) => set(() => ({
		tabCreation,
		showTabCreator: true,
	})),

	closeTabCreator: () => set(() => ({
		showTabCreator: false,
	})),

	openTabEditor: (editingId) => set(() => ({
		editingId,
		showTabEditor: true,
	})),

	closeTabEditor: () => set(() => ({
		showTabEditor: false,
	})),
}));