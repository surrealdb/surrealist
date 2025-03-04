import { useAbsoluteLocation, useViewFocus } from "~/hooks/routing";

export function SidekickView() {
	const [, navigate] = useAbsoluteLocation();

	// For now, redirect to the chat page when the sidekick is focused
	useViewFocus("sidekick", () => {
		navigate("/chat");
	});

	return null;
}

export default SidekickView;
