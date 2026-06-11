import { ActionIcon, Box } from "@mantine/core";
import { Icon, iconSidebar } from "@surrealdb/ui";
import { useEffect } from "react";
import { ActionBar } from "~/components/ActionBar";
import { useAbsoluteLocation } from "~/hooks/routing";
import { SurrealistSidebar } from "../sidebar";
import { BAR_HEIGHT, useBottomSheet } from "./sheet";
import classes from "./style.module.scss";

/**
 * The mobile navigation layer: a fixed bottom bar with a menu button (which drags or
 * taps open the sidebar navigation sheet) and the quick action buttons, plus the
 * draggable navigation sheet itself.
 */
export function MobileNavigation() {
	const sheet = useBottomSheet();
	const [location] = useAbsoluteLocation();

	// Close the sheet whenever the user navigates to a new location
	// biome-ignore lint/correctness/useExhaustiveDependencies: close on location change
	useEffect(() => {
		sheet.close();
	}, [location]);

	const dragging = sheet.offset !== null;

	const sheetTransform =
		sheet.offset !== null
			? `translateY(${sheet.offset}px)`
			: sheet.opened
				? "translateY(0)"
				: `translateY(calc(100% + ${BAR_HEIGHT}px))`;

	return (
		<>
			<Box
				className={classes.backdrop}
				data-interactive={sheet.progress > 0 || undefined}
				style={{ opacity: sheet.progress }}
				onClick={sheet.close}
			/>

			<Box
				ref={sheet.sheetRef}
				className={classes.sheet}
				style={{
					transform: sheetTransform,
					transition: dragging ? "none" : undefined,
				}}
			>
				<Box
					className={classes.grabber}
					{...sheet.getHandleProps()}
				>
					<Box className={classes.grabHandle} />
				</Box>

				<Box className={classes.sheetBody}>
					<SurrealistSidebar
						fill
						pos="static"
						w="100%"
						h="100%"
						pt={0}
					/>
				</Box>
			</Box>

			<Box className={classes.bar}>
				<ActionIcon
					className={classes.menuButton}
					aria-label="Open navigation"
					variant="subtle"
					size="lg"
					{...sheet.getHandleProps()}
				>
					<Icon path={iconSidebar} />
				</ActionIcon>

				<Box className={classes.actions}>
					<ActionBar />
				</Box>
			</Box>
		</>
	);
}
