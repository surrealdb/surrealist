import { Box, Button, Divider, ScrollArea, Stack } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { useAccountActions } from "~/components/ActionBar/account-actions";

export interface AccountPanelProps {
	onAction: () => void;
}

/** Account menu content rendered inside the mobile bottom card. */
export function AccountPanel({ onAction }: AccountPanelProps) {
	const { profile, rows } = useAccountActions();

	return (
		<ScrollArea
			h="100%"
			scrollbars="y"
			type="never"
		>
			<Stack
				gap="xs"
				p="lg"
			>
				{profile && (
					<>
						<Box px="sm">{profile}</Box>
						<Divider />
					</>
				)}

				{rows.map((row, index) =>
					row.kind === "divider" ? (
						<Divider key={index} />
					) : (
						<Button
							key={index}
							variant="subtle"
							color="slate"
							fullWidth
							justify="flex-start"
							size="md"
							leftSection={<Icon path={row.icon} />}
							rightSection={row.right}
							onClick={() => {
								row.onClick();
								onAction();
							}}
							styles={{ label: { flex: 1, textAlign: "left" } }}
						>
							{row.label}
						</Button>
					),
				)}
			</Stack>
		</ScrollArea>
	);
}
