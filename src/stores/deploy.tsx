import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { CloudOrganization, CloudRegion } from "~/types";

export type DeployStore = {
	organization: CloudOrganization | null;
	region: CloudRegion | null;
	data: File | null;
	deployConnectionId: string | null;
	isDeploying: boolean;
	setDeployConnectionId: (deployConnectionId: string | null) => void;
	setOrganization: (organization: CloudOrganization | null) => void;
	setRegion: (region: CloudRegion | null) => void;
	setData: (data: File | null) => void;
	setIsDeploying: (isDeploying: boolean) => void;
};

export const useDeployStore = create<DeployStore>()(
	immer((set) => ({
		organization: null,
		region: null,
		data: null,
		deployConnectionId: null,
		isDeploying: false,
		setDeployConnectionId: (deployConnectionId) => set({ deployConnectionId }),
		setIsDeploying: (isDeploying) => set({ isDeploying }),
		setOrganization: (organization) => set({ organization }),
		setRegion: (region) => set({ region }),
		setData: (data) => set({ data }),
	})),
);
