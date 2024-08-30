import { LoadingOverlay } from "@mantine/core";

export interface LoadingContainerProps {
	visible?: boolean
}

export function LoadingContainer({
	visible
}: LoadingContainerProps) {
	return (
		<LoadingOverlay
			visible={visible}
			zIndex={1000}
			overlayProps={{ radius: 'lg', opacity: 0.75, bg: 'slate.8' }}
			transitionProps={{ duration: 150 }}
			loaderProps={{ type: 'dots' }}
		/>
	);
}