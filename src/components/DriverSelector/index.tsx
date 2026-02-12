import { type BoxProps, Paper, SimpleGrid, type StyleProp, Text } from "@mantine/core";
import clsx from "clsx";
import { useMemo } from "react";
import { DRIVERS } from "~/constants";
import type { CodeLang } from "~/types";
import classes from "./style.module.scss";

export interface DriverSelectorProps extends BoxProps {
	cols: StyleProp<number>;
	value: CodeLang;
	exclude?: CodeLang[];
	disabled?: CodeLang[];
	onChange: (value: CodeLang) => void;
}

export function DriverSelector({
	cols,
	value,
	exclude,
	disabled,
	onChange,
	...other
}: DriverSelectorProps) {
	const drivers = useMemo(() => {
		return DRIVERS.filter((lib) => !exclude?.includes(lib.id));
	}, [exclude]);

	return (
		<SimpleGrid
			cols={cols}
			{...other}
		>
			{drivers.map((lib) => {
				const Icon = lib.icon;
				const isActive = value === lib.id;

				return (
					<Paper
						key={lib.name}
						radius="md"
						bg="var(--mantine-color-body)"
						className={clsx(
							classes.library,
							isActive && classes.libraryActive,
							disabled?.includes(lib.id) && classes.libraryDisabled,
						)}
						onClick={() => onChange(lib.id)}
					>
						<Icon />
						<Text mt="xs">{lib.name}</Text>
					</Paper>
				);
			})}
		</SimpleGrid>
	);
}
