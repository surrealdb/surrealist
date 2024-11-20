import classes from "./style.module.scss";

import { type BoxProps, Paper, SimpleGrid, type StyleProp, Text } from "@mantine/core";
import clsx from "clsx";
import { useMemo } from "react";
import { DRIVERS } from "~/constants";
import { useIsLight } from "~/hooks/theme";
import type { CodeLang } from "~/types";

export interface DriverSelectorProps extends BoxProps {
	cols: StyleProp<number>;
	value: CodeLang;
	exclude?: CodeLang[];
	onChange: (value: CodeLang) => void;
}

export function DriverSelector({ cols, value, exclude, onChange, ...other }: DriverSelectorProps) {
	const isLight = useIsLight();

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
						radius="xl"
						bg={isLight ? "slate.0" : "slate.9"}
						className={clsx(
							classes.library,
							isActive && classes.libraryActive,
							lib.disabled && classes.libraryDisabled,
						)}
						onClick={() => onChange(lib.id)}
					>
						<Icon active={isActive} />
						<Text mt="xs">{lib.name}</Text>
					</Paper>
				);
			})}
		</SimpleGrid>
	);
}
