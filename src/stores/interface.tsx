import { ColorScheme } from "~/types";
import { create } from "zustand";

interface LiveMessage {
	id: string;
	action: string;
	queryId: string;
	timestamp: number;
	data: any;
}

export type InterfaceStore = {
	colorPreference: ColorScheme;
	colorScheme: ColorScheme;
	availableUpdate: string;
	showAvailableUpdate: boolean;
	showConnectionEditor: boolean;
	isCreatingConnection: boolean;
	editingConnectionId: string;
	liveTabs: Set<string>;
	liveQueryMessages: Record<string, LiveMessage[]>;

	setColorPreference: (preference: ColorScheme) => void;
	setColorScheme: (scheme: ColorScheme) => void;
	setAvailableUpdate: (availableUpdate: string) => void;
	hideAvailableUpdate: () => void;
	openConnectionCreator: () => void;
	openConnectionEditor: (editingId: string) => void;
	closeConnectionEditor: () => void;
	setIsLive: (id: string, live: boolean) => void;
	pushLiveQueryMessage: (id: string, message: LiveMessage) => void;
	clearLiveQueryMessages: (id: string) => void;
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
	liveTabs: new Set<string>(),
	liveQueryMessages: {},

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

	setIsLive: (id, live) => set((state) => {
		const liveTabs = new Set(state.liveTabs);

		if (live) {
			liveTabs.add(id);
		} else {
			liveTabs.delete(id);
		}

		return {
			liveTabs
		};
	}),

	pushLiveQueryMessage: (id, message) => set((state) => ({
		liveQueryMessages: {
			...state.liveQueryMessages,
			[id]: [
				message,
				...(state.liveQueryMessages[id] || []).slice(0, 50)
			]
		}
	})),

	clearLiveQueryMessages: (id) => set((state) => {
		const liveQueryMessages = { ...state.liveQueryMessages };

		delete liveQueryMessages[id];

		return {
			liveQueryMessages
		};
	}),

}));
