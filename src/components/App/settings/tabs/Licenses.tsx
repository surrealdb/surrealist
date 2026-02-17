import { Box, ScrollArea, Table } from "@mantine/core";
import licenseReport from "~/assets/data/license-report.json";
import { Link } from "~/components/Link";

export function LicensesTab() {
	return (
		<ScrollArea
			mt="xl"
			scrollbars="xy"
			type="always"
			bottom="var(--mantine-spacing-xl)"
		>
			<Box m="xs">
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
							const link = pkg.link.startsWith("git+") ? pkg.link.slice(4) : pkg.link;

							return (
								<Table.Tr key={pkg.name}>
									<Table.Td>{pkg.name}</Table.Td>
									<Table.Td>{pkg.licenseType}</Table.Td>
									<Table.Td>{pkg.installedVersion}</Table.Td>
									<Table.Td>{pkg.author}</Table.Td>
									<Table.Td>
										<Link href={link}>{link}</Link>
									</Table.Td>
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
			</Box>
		</ScrollArea>
	);
}
