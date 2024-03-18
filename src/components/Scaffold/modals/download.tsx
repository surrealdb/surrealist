import banner from "~/assets/images/banner.webp";
import { ActionIcon, Button, Divider, Image, List, Modal, Stack, Text, Title } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { iconArrowUpRight, iconCircle, iconClose } from "~/util/icons";

export interface DownloadModalProps {
	opened: boolean;
	onClose: () => void;
	onOpen: () => void;
}

export function DownloadModal({ opened, onClose, onOpen }: DownloadModalProps) {
	return (
		<Modal
			opened={opened}
			onClose={onClose}
			size={550}
			padding={0}
		>
			<ActionIcon
				pos="absolute"
				top={16}
				right={16}
				onClick={onClose}
			>
				<Icon path={iconClose} />
			</ActionIcon>

			<Image src={banner} />

			<Divider />

			<Stack p="lg">
				<Title c="bright" fz={32} ta="center">
					Surrealist for Desktop
				</Title>

				<Text size="lg">
					Take your SurrealDB journey to the next level with Surrealist for Desktop and gain advanced capabilities designed for an optimized experience
				</Text>

				<List
					fz="lg"
					icon={<Icon path={iconCircle} color="surreal" />}
				>
					<List.Item>
						Access Surrealist in offline environments
					</List.Item>
					<List.Item>
						Launch your local database directly from Surrealist
					</List.Item>
				</List>

				<Button
					mt="lg"
					variant="gradient"
					component="a"
					rightSection={<Icon path={iconArrowUpRight} />}
					onClick={onClose}
					fullWidth
					href="https://github.com/surrealdb/surrealist/releases"
					target="_blank"
				>
					Download
				</Button>
			</Stack>
		</Modal>
	);
}
