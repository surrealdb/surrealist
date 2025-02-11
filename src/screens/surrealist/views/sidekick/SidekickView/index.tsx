import { useViewFocus } from "~/hooks/routing";

export function SidekickView() {
	// const [, setPage] = useActiveCloudPage();

	// For now, redirect to the chat page when the sidekick is focused
	useViewFocus("sidekick", () => {
		// setPage("chat");
	});

	return null;
}

export default SidekickView;
