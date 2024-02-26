import { useSetting } from "~/hooks/config";
import { Connection, DiagramMode } from "~/types";

export function useNodeMode(connection: Connection | undefined): DiagramMode {
	const [defaultDiagramMode] = useSetting("appearance", "defaultDiagramMode");
	
	return connection?.designerNodeMode ?? defaultDiagramMode;
}