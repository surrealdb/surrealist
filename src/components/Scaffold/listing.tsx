import classes from "./style.module.scss";
import { Popover, Button, Stack, NavLink } from "@mantine/core";
import { VIEW_MODES } from "~/constants";
import { ViewMode } from "~/types";
import { Icon } from "../Icon";
import { useIsLight } from "~/hooks/theme";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { mod, updateTitle } from "~/util/helpers";
import { useHotkeys } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";

export interface ViewListingProps {
	viewMode: ViewMode;
}

export function ViewListing({ viewMode }: ViewListingProps) {
	const isLight = useIsLight();
	const navigate = useNavigate();
	const [isViewListing, setIsViewListing] = useState(false);
	
	const viewInfo = VIEW_MODES.find((v) => v.id == viewMode)!;

	const setViewMode = useStable((id: ViewMode) => {
		setIsViewListing(false);
		navigate(`/${id}`);
		updateTitle();
	});

	const relativeViewMode = useStable((value: number) => {
		const current = VIEW_MODES.findIndex((v: any) => v.id == viewMode);
		const next = mod(current + value, VIEW_MODES.length);

		setViewMode(VIEW_MODES[next].id);
	});

	useHotkeys([
		["ctrl+arrowLeft", () => relativeViewMode(-1)],
		["ctrl+arrowRight", () => relativeViewMode(1)],
	], []);

	return (
		<Popover
			opened={isViewListing}
			onChange={setIsViewListing}
			position="bottom-start"
			closeOnEscape
			transitionProps={{ duration: 0, exitDuration: 0 }}
			shadow={`0 8px 25px rgba(0, 0, 0, ${isLight ? 0.2 : 0.75})`}
			withArrow
		>
			<Popover.Target>
				<Button
					px="lg"
					h="100%"
					color="surreal.4"
					variant="gradient"
					title="Select view"
					onClick={() => setIsViewListing(!isViewListing)}>
					<Icon path={viewInfo.icon} left />
					{viewInfo.name}
				</Button>
			</Popover.Target>
			<Popover.Dropdown px="xs">
				<Stack spacing="xs">
					{VIEW_MODES.map((info) => {
						const isActive = info.id === viewMode;

						return (
							<Button
								key={info.id}
								w={264}
								px={0}
								h="unset"
								color={isActive ? "pink" : "blue"}
								variant={isActive ? "light" : "subtle"}
								className={classes.viewModeButton}
								onClick={() => setViewMode(info.id as ViewMode)}
							>
								<NavLink
									component="div"
									className={classes.viewModeContent}
									label={info.name}
									icon={<Icon color="surreal" path={info.icon} />}
									description={
										<Stack spacing={6}>
											{info.desc}
										</Stack>
									}
									styles={{
										label: {
											color: isLight ? "black" : "white",
											fontWeight: 600,
										},
										description: {
											whiteSpace: "normal",
										},
									}}
								/>
							</Button>
						);
					})}
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}