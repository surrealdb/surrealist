import { Accordion, Group, Stack, Button, Text, Space, ActionIcon } from "@mantine/core";
import { mdiCircle, mdiClose, mdiDelete, mdiPlus } from "@mdi/js";
import { ReactNode } from "react";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";

export interface ListerProps<T> {
	name: string;
	missing: string;
	value: T[];
	children: (item: T, index: number) => ReactNode;
	onCreate: () => void;
	onRemove: (index: number) => void;
}

export function Lister<T extends { name: string }>(props: ListerProps<T>) {

	const handleRemove = useStable((e: React.MouseEvent, index: number) => {
		e.stopPropagation();
		props.onRemove(index);
	});

	return (
		<>
			{props.value.length > 0 ? (
				<Accordion multiple style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
					{props.value.map((item, i) => (
						<Accordion.Item
							key={i}
							value={i.toString()}
							style={{ border: 0 }}
						>
							<Accordion.Control
								py="sm"
								bg="dark.9"
								pos="relative"
								style={{ borderRadius: 8 }}
							>
								<Group spacing="sm">
									<Icon
										path={mdiCircle}
										color="surreal"
										size={0.45}
									/>
									{item.name
										? <Text>{item.name}</Text>
										: <Text color="gray" italic>Unnamed {props.name}</Text>
									}
									<Spacer />
									<ActionIcon
										role="button"
										component="div"
										onClick={e => handleRemove(e, i)}
										style={{ position: 'absolute', right: 38 }}
										color="red"
									>
										<Icon path={mdiClose} color="red" />
									</ActionIcon>
								</Group>
							</Accordion.Control>
							<Accordion.Panel>
								<Stack>
									{props.children(item, i)}
								</Stack>
							</Accordion.Panel>
						</Accordion.Item>
					))}
				</Accordion>
			) : (
				<Text align="center">
					{props.missing}
				</Text>
			)}

			<Button
				mt="md"
				size="xs"
				fullWidth
				variant="outline"
				rightIcon={<Icon path={mdiPlus} />}
				onClick={props.onCreate}
			>
				Add {props.name}
			</Button>
		</>
	)
}