import { Button, Divider, Group, ScrollArea, Text } from "@mantine/core";
import { Box, Paper, Stack, Title } from "@mantine/core";
import type { FallbackProps } from "react-error-boundary";
import { adapter } from "~/adapter";
import { useVersionCopy } from "~/hooks/debug";
import { useIsLight } from "~/hooks/theme";
import { iconBug, iconCheck, iconCopy, iconCursor, iconWarning } from "~/util/icons";
import { CodePreview } from "../CodePreview";
import { Icon } from "../Icon";

export function ScaffoldErrorHandler({ error, resetErrorBoundary }: FallbackProps) {
	const [copyDebug, clipboard] = useVersionCopy();
	const isLight = useIsLight();

	const message = error instanceof Error ? error.message : error;

	return (
		<ScrollArea
			h="100%"
			bg={isLight ? "slate.0" : "slate.9"}
		>
			<Paper
				p="xl"
				maw={800}
				mx="auto"
				my={75}
			>
				<Stack gap="lg">
					<Group c="bright">
						<Icon
							path={iconWarning}
							size="lg"
						/>
						<Title>Surrealist encountered an error</Title>
					</Group>

					<Text>
						You can find a detailed error message below. If you believe this is a bug,
						please report it on our GitHub repository.
					</Text>

					<Group>
						<Button
							leftSection={<Icon path={iconCursor} />}
							onClick={resetErrorBoundary}
							variant="light"
							color="slate"
							radius="xs"
							size="xs"
						>
							Reload Surrealist
						</Button>
						<Button
							leftSection={<Icon path={iconBug} />}
							onClick={() =>
								adapter.openUrl("https://github.com/surrealdb/surrealist/issues")
							}
							variant="light"
							color="slate"
							radius="xs"
							size="xs"
						>
							File an issue
						</Button>
						<Button
							leftSection={<Icon path={clipboard.copied ? iconCheck : iconCopy} />}
							onClick={copyDebug}
							variant="light"
							color="slate"
							radius="xs"
							size="xs"
						>
							{clipboard.copied ? "Copied!" : "Copy version information"}
						</Button>
					</Group>

					<Divider />

					{message && (
						<Box>
							<Title order={3}>Message</Title>

							<CodePreview
								value={message}
								withCopy
							/>
						</Box>
					)}

					{error.cause && (
						<Box>
							<Title order={3}>Cause</Title>

							<CodePreview
								value={error.cause}
								withCopy
							/>
						</Box>
					)}

					{error.stack && (
						<Box>
							<Title order={3}>Stack trace</Title>

							<CodePreview
								value={error.stack}
								withCopy
							/>
						</Box>
					)}
				</Stack>
			</Paper>
		</ScrollArea>
		// <div style={{
		// 	width: '100%',
		// 	display: 'flex',
		// 	justifyContent: 'center',
		// 	paddingTop: '50px',
		// }}>
		// 	<div style={{
		// 		display: 'flex',
		// 		flexDirection: 'column',
		// 		justifyContent: 'center',
		// 	}}>
		// 		<h1>Something went wrong!</h1>
		// 		{error.name && <h2>{error.name}</h2>}
		// 		<div style={{
		// 			padding: '0px 10px',
		// 			border: '1px solid black'
		// 		}}>
		// 			<h3>Message</h3>
		// 			<p style={{
		// 				whiteSpace: 'pre',
		// 				overflowX: 'auto',
		// 				maxWidth: '90vw'
		// 			}}>
		// 				{message}
		// 			</p>
		// 		</div>
		// 		{error.cause && (
		// 			<div style={{
		// 				padding: '0px 10px',
		// 				border: '1px solid black',
		// 				marginTop: '20px',
		// 			}}>
		// 				<h3>Cause</h3>
		// 				<p style={{
		// 					whiteSpace: 'pre',
		// 					overflowX: 'auto',
		// 					maxWidth: '90vw'
		// 				}}>
		// 					{error.cause}
		// 				</p>
		// 			</div>
		// 		)}
		// 		{error.stack && (
		// 			<div style={{
		// 				padding: '0px 10px',
		// 				border: '1px solid black',
		// 				marginTop: '20px',
		// 			}}>
		// 				<h3>Stack trace</h3>
		// 				<p style={{
		// 					whiteSpace: 'pre',
		// 					overflowX: 'auto',
		// 					maxWidth: '90vw',
		// 					lineHeight: '30px',
		// 				}}>
		// 					{error.stack}
		// 				</p>
		// 			</div>
		// 		)}
		// 		<div style={{
		// 			display: 'flex',
		// 			justifyContent: 'center',
		// 			marginTop: '40px',
		// 		}}>
		// 			<button onClick={resetErrorBoundary} style={{
		// 				padding: '10px',
		// 				background: 'black',
		// 				color: 'white',
		// 				border: 'none',
		// 				cursor: 'pointer',
		// 				fontSize: '16px',
		// 				fontWeight: '600',
		// 			}}>
		// 				Reload Surrealist
		// 			</button>
		// 		</div>
		// 	</div>
		// </div>
	);
}
