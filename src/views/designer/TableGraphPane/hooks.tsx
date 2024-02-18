import { useConfigStore } from "~/stores/config";
import { Connection, DesignerNodeMode } from "~/types";

export function useNodeMode(connection: Connection | undefined): DesignerNodeMode {
	const defaultNodeMode = useConfigStore((s) => s.defaultDesignerNodeMode);
	
	return connection?.designerNodeMode ?? defaultNodeMode;
}