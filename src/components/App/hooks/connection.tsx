import { useEffect } from "react";
import { useConnectionFromRoute } from "~/hooks/routing";
import {
	closeConnection,
	openConnection,
} from "~/screens/surrealist/pages/Connection/connection/connection";

/**
 * Watch for connection changes and open the connection
 */
export function useConnectionSwitch() {
	const connection = useConnectionFromRoute();

	useEffect(() => {
		if (connection) {
			openConnection();
		} else {
			closeConnection();
		}
	}, [connection]);
}
