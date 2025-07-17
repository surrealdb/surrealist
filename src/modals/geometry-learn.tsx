import { Stack, Text, Button, Group } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Icon } from "~/components/Icon";
import { adapter } from "~/adapter";
import { iconBook } from "~/util/icons";

export function openGeometryLearnModal() {
	openModal({
		title: (
			<Group gap="xs">
				<Icon
					path={iconBook}
					size="sm"
				/>
				<PrimaryTitle fz={24}>Learn about SurrealQL Geometries</PrimaryTitle>
			</Group>
		),
		withCloseButton: true,
		size: 600,
		children: <GeometryLearnModalContent />, // see below
		padding: 32,
	});
}

function GeometryLearnModalContent() {
	return (
		<Stack gap="lg">
			<Text c="slate.3">
				SurrealQL supports a variety of geometry types for storing and querying spatial
				data, including points, lines, polygons, and collections. These types are compatible
				with GeoJSON and can be used for advanced geospatial queries.
			</Text>

			<Button
				component="a"
				target="_blank"
				href="https://surrealdb.com/docs/surrealql/datamodel/geometries"
				leftSection={<Icon path={iconBook} />}
				variant="gradient"
				onClick={() =>
					adapter.openUrl("https://surrealdb.com/docs/surrealql/datamodel/geometries")
				}
			>
				Read SurrealQL Geometry Documentation
			</Button>
		</Stack>
	);
}
