import { useMediaQuery } from "@mantine/hooks";

/**
 * Returns `true` when the viewport is at or above the `md` breakpoint (62em / 992px),
 * the point at which the desktop sidebar layout is used. Below this we switch to the
 * mobile layout (focused top bar + fixed bottom navigation).
 *
 * Defaults to `true` on first paint to avoid flashing the mobile layout in this SPA.
 */
export function useIsDesktop() {
	return useMediaQuery("(min-width: 62em)", true, { getInitialValueInEffect: false });
}
