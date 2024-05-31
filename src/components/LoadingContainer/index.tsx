import { LoadingOverlay } from "@mantine/core";

export const LoadingContainer = ({ visible }: { visible?: boolean }) => {
	return (
		<LoadingOverlay
			visible={visible}
			zIndex={1000}
			overlayProps={{ radius: 'lg', opacity: 0.75, bg: 'slate.8' }}
			loaderProps={{ type: 'dots' }} />
	);
};