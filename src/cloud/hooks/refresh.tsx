import { useQueryClient } from "@tanstack/react-query";
import { useStable } from "~/hooks/stable";
import { closeConnection } from "~/screens/surrealist/connection/connection";

export function useInstanceRefresher() {
	const client = useQueryClient();

	return useStable(async () => {
		closeConnection(true);

		await client.invalidateQueries({
			queryKey: ["cloud", "instances"],
		});
	});
}
