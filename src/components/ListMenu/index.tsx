import { Text, Tooltip } from "@mantine/core";
import { Menu } from "@mantine/core";
import type { PropsWithChildren } from "react";
import { useIsLight } from "~/hooks/theme";
import type { Listable } from "~/types";
import { iconCheck } from "~/util/icons";
import { Icon } from "../Icon";

export interface ListMenuProps<T extends string> {
	data: Listable<T>[];
	value: T;
	onChange: (value: T) => void;
}

export function ListMenu<T extends string>({
	data,
	value,
	onChange,
	children,
}: PropsWithChildren<ListMenuProps<T>>) {
	const isLight = useIsLight();

	return (
		<Menu
			position="bottom-end"
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>
				{children}
			</Menu.Target>
			<Menu.Dropdown w={264}>
				{data.map(({ label, value: itemValue, icon, description }) => (
					<Menu.Item
						key={itemValue}
						onClick={() => onChange(itemValue)}
						leftSection={
							icon && (
								<Icon
									path={icon}
									mr="xs"
								/>
							)
						}
						rightSection={
							value === itemValue && (
								<Icon
									path={iconCheck}
									ml="xs"
								/>
							)
						}
					>
						<Text c="bright">{label}</Text>
						{description && (
							<Text
								c={isLight ? "slate.5" : "slate.3"}
								size="sm"
							>
								{description}
							</Text>
						)}
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}
