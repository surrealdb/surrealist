import { ColorScheme, TabCreation } from "~/types";
import { create } from "zustand";

export type InterfaceStore = {
	colorPreference: ColorScheme,
	colorScheme: ColorScheme,
	availableUpdate: string,
	showAvailableUpdate: boolean,
	showTabCreator: boolean,
	tabCreation: TabCreation | null,
	showTabEditor: boolean,
	editingId: string,

	setColorPreference: (preference: ColorScheme) => void;
	setColorScheme: (scheme: ColorScheme) => void;
	setAvailableUpdate: (availableUpdate: string) => void;
	hideAvailableUpdate: () => void;
	openTabCreator: (tabCreation: TabCreation) => void;
	closeTabCreator: () => void;
	openTabEditor: (editingId: string) => void;
	closeTabEditor: () => void;

	softReset: () => void;
};

const defaults = {
	colorPreference: "dark",
	colorScheme: "dark",
	availableUpdate: "",
	showAvailableUpdate: false,
	showTabCreator: false,
	tabCreation: null,
	showTabEditor: false,
	editingId: "",
} satisfies Partial<InterfaceStore>;

export const useInterfaceStore = create<InterfaceStore>((set) => ({
	...defaults,

	setColorPreference: (themePreference) => set(() => ({
		colorPreference: themePreference
	})),

	setColorScheme: (colorScheme) => set(() => ({
		colorScheme,
	})),
	
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


	softReset: () => set(() => defaults),
}));
