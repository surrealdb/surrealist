import { create } from "zustand";
import { Update } from "@tauri-apps/plugin-updater";
import { ColorScheme, LiveMessage } from "~/types";

export type InterfaceStore = {
	title: string;
	colorScheme: ColorScheme;
	availableUpdate: null | Update;
	showAvailableUpdate: boolean;
	showTableCreator: boolean;
	liveTabs: Set<string>;
	liveQueryMessages: Record<string, LiveMessage[]>;
	showScopeSignup: boolean;
	showChangelogAlert: boolean;
	hasReadChangelog: boolean;
	showQueryVariables: boolean;
	showGraphqlVariables: boolean;

	setWindowTitle: (title: string) => void;
	setColorScheme: (colorScheme: ColorScheme) => void;
	setAvailableUpdate: (update: Update) => void;
	setIsLive: (id: string, live: boolean) => void;
	openTableCreator: () => void;
	closeTableCreator: () => void;
	pushLiveQueryMessage: (id: string, message: LiveMessage) => void;
	clearLiveQueryMessages: (id: string) => void;
	openScopeSignup: () => void;
	closeScopeSignup: () => void;
	showChangelog: () => void;
	readChangelog: () => void;
	setShowQueryVariables: (show: boolean) => void;
	setShowGraphqlVariables: (show: boolean) => void;
	toggleQueryVariables: () => void;
	toggleGraphqlVariables: () => void;
};

export const useInterfaceStore = create<InterfaceStore>((set) => ({
	title: "",
	colorScheme: "dark",
	availableUpdate: null,
	showAvailableUpdate: false,
	showConnectionEditor: false,
	isCreatingConnection: false,
	editingConnectionId: "",
	showTableCreator: false,
	liveTabs: new Set<string>(),
	liveQueryMessages: {},
	showScopeSignup: false,
	showChangelogAlert: false,
	hasReadChangelog: false,
	showQueryVariables: false,
	showGraphqlVariables: false,

	setWindowTitle: (title) => set(() => ({ title })),

	setColorScheme: (colorScheme) => set(() => ({
		colorScheme
	})),

	setAvailableUpdate: (availableUpdate) => set(() => ({
		availableUpdate,
		showAvailableUpdate: true,
	})),

	hideAvailableUpdate: () => set(() => ({
		showAvailableUpdate: false,
	})),

	openTableCreator: () => set(() => ({
		showTableCreator: true,
	})),

	closeTableCreator: () => set(() => ({
		showTableCreator: false,
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

	openScopeSignup: () => set(() => ({
		showScopeSignup: true,
	})),

	closeScopeSignup: () => set(() => ({
		showScopeSignup: false,
	})),

	showChangelog: () => set(() => ({
		showChangelogAlert: true,
	})),

	readChangelog: () => set(() => ({
		hasReadChangelog: true,
	})),

	setShowQueryVariables: (show) => set(() => ({
		showQueryVariables: show,
	})),

	toggleQueryVariables: () => set((state) => ({
		showQueryVariables: !state.showQueryVariables,
	})),

	setShowGraphqlVariables: (show) => set(() => ({
		showGraphqlVariables: show,
	})),

	toggleGraphqlVariables: () => set((state) => ({
		showGraphqlVariables: !state.showGraphqlVariables,
	})),

}));
