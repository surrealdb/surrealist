import { useEffect } from "react";
import { useActiveConnection } from "~/hooks/routing";
import { closeConnection, openConnection } from "~/screens/surrealist/connection/connection";

/**
 * Watch for connection changes and open the connection
 */
export function useConnectionSwitch() {
	const [connection] = useActiveConnection();

	useEffect(() => {
		if (connection) {
			openConnection();
		} else {
			closeConnection();
		}
	}, [connection]);
}
