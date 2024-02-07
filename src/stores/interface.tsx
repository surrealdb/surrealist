import { ColorScheme } from "~/types";
import { create } from "zustand";

export type InterfaceStore = {
	colorPreference: ColorScheme;
	colorScheme: ColorScheme;
	availableUpdate: string;
	showAvailableUpdate: boolean;
	showConnectionEditor: boolean;
	isCreatingConnection: boolean;
	editingConnectionId: string;

	setColorPreference: (preference: ColorScheme) => void;
	setColorScheme: (scheme: ColorScheme) => void;
	setAvailableUpdate: (availableUpdate: string) => void;
	hideAvailableUpdate: () => void;
	openConnectionCreator: () => void;
	openConnectionEditor: (editingId: string) => void;
	closeConnectionEditor: () => void;
};

export const useInterfaceStore = create<InterfaceStore>((set) => ({
	colorPreference: "dark",
	colorScheme: "dark",
	availableUpdate: "",
	showAvailableUpdate: false,
	showTabCreator: false,
	tabCreation: null,
	showConnectionEditor: false,
	isCreatingConnection: false,
	editingConnectionId: "",

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

	openConnectionCreator: () => set(() => ({
		editingConnectionId: "",
		showConnectionEditor: true,
		isCreatingConnection: true,
	})),

	openConnectionEditor: (editingId) => set(() => ({
		editingConnectionId: editingId,
		showConnectionEditor: true,
		isCreatingConnection: false,
	})),

	closeConnectionEditor: () => set(() => ({
		showConnectionEditor: false,
	})),

}));
