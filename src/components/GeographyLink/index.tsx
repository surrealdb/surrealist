import { Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useStable } from "~/hooks/stable";
import { iconMarker } from "~/util/icons";
import { GeographyDrawer } from "../GeographyDrawer";
import type { GeographyInput } from "../GeographyMap";
import { Icon } from "../Icon";

export interface GeographyLinkProps extends ComponentPropsWithoutRef<"div"> {
	value: GeographyInput;
	text: string;
}

export const GeographyLink = ({ value, text, ...rest }: GeographyLinkProps) => {
	const [opened, handlers] = useDisclosure();

	const handleOpen = useStable((e: MouseEvent) => {
		e.stopPropagation();
		handlers.open();
	});

	const handleClose = useStable(() => {
		handlers.close();
	});

	return (
		<>
			<Group
				{...rest}
				wrap="nowrap"
				c="surreal.5"
				gap={0}
				onClick={handleOpen}
				style={{
					cursor: "pointer",
				}}
			>
				<Text
					style={{
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
						maxWidth: 300,
					}}
				>
					{text}
				</Text>
				<Icon path={iconMarker} right />
			</Group>

			<GeographyDrawer
				opened={opened}
				data={value}
				onClose={handleClose}
			/>
		</>
	);
};
