import { mdiFormatLineSpacing } from "@mdi/js";
import { ActionIcon, type ActionIconProps } from "@mantine/core";
import { HTMLPropsRef, MRT_TableInstance } from "mantine-react-table";

import { Icon } from "../Icon";

interface Props<TData extends Record<string, any> = {}> extends ActionIconProps, HTMLPropsRef<HTMLButtonElement> {
	table: MRT_TableInstance<TData>;
}

const sizes = ["xs", "md", "xl"] as const;

export const ToggleDensePaddingButton = <TData extends Record<string, any> = {}>({ table }: Props<TData>) => {
	const { getState, setDensity } = table;
	const { density } = getState();

	const handleToggleDensePadding = () => {
		setDensity(sizes[(sizes.indexOf(density) - 1) % sizes.length] ?? "xl");
	};

	return (
		<ActionIcon onClick={handleToggleDensePadding} title="Change row density">
			<Icon color="light.4" path={mdiFormatLineSpacing} />
		</ActionIcon>
	);
};
