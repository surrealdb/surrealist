import { ScrollArea, Text, ThemeIcon } from "@mantine/core";
import { Menu } from "@mantine/core";
import type { PropsWithChildren } from "react";
import { useIsLight } from "~/hooks/theme";
import type { Listable } from "~/types";
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
			// position="bottom-end"
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>{children}</Menu.Target>
			<Menu.Dropdown>
				<ScrollArea.Autosize mah={250}>
					{data.map(({ label, value: itemValue, icon, description }) => (
						<Menu.Item
							key={itemValue}
							onClick={() => onChange(itemValue)}
							leftSection={
								icon && (
									<ThemeIcon
										radius="xs"
										color="slate"
										variant={value === itemValue ? "gradient" : "light"}
										mr="xs"
									>
										<Icon path={icon} />
									</ThemeIcon>
								)
							}
						>
							<Text
								c="bright"
								fw={500}
							>
								{label}
							</Text>
							{description && (
								<Text
									c={isLight ? "slate.5" : "slate.3"}
									size="sm"
									mt={-2}
								>
									{description}
								</Text>
							)}
						</Menu.Item>
					))}
				</ScrollArea.Autosize>
			</Menu.Dropdown>
		</Menu>
	);
}
