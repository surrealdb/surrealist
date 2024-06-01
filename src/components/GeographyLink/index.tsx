import { Group, Text } from "@mantine/core";
import { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useStable } from "~/hooks/stable";
import { GeographyDrawer, GeographyInput } from "../GeographyDrawer";
import { useDisclosure } from "@mantine/hooks";

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
					cursor: "pointer"
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
			</Group>

			<GeographyDrawer opened={opened} data={value} onClose={handleClose} />
		</>
	);
};
