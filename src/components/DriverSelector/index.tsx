import classes from "./style.module.scss";

import type { CodeLang } from "~/types";
import { type BoxProps, Paper, SimpleGrid, Text, type StyleProp } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import clsx from "clsx";
import { DRIVERS } from "~/constants";
import { useMemo } from "react";

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
						className={clsx(classes.library, isActive && classes.libraryActive)}
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
