import { Anchor, ScrollArea, Table } from "@mantine/core";
import licenseReport from "~/assets/data/license-report.json";

export function LicensesTab() {
	return (
		<>
			<ScrollArea
				scrollbars="xy"
				type="always"
				pos="absolute"
				top={0}
				left={0}
				right={0}
				bottom="var(--mantine-spacing-xl)"
			>
				<Table style={{ whiteSpace: "nowrap" }}>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Package</Table.Th>
							<Table.Th>License</Table.Th>
							<Table.Th>Version</Table.Th>
							<Table.Th>Author</Table.Th>
							<Table.Th>Link</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{licenseReport.map((pkg) => {
							const link = pkg.link.startsWith('git+') ? pkg.link.slice(4) : pkg.link;

							return (
								<Table.Tr key={pkg.name}>
									<Table.Td>{pkg.name}</Table.Td>
									<Table.Td>{pkg.licenseType}</Table.Td>
									<Table.Td>{pkg.installedVersion}</Table.Td>
									<Table.Td>{pkg.author}</Table.Td>
									<Table.Td>
										<Anchor href={link}>
											{link}
										</Anchor>
									</Table.Td>
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</>
	);
}
