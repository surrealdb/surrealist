import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsDataModelsGeospatial({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
CREATE city:london SET
	name = "London",
	location = (-0.118092, 51.509865);

-- Calculate distance between two points
LET $london = (-0.118092, 51.509865);
LET $paris = (2.352222, 48.856613);
RETURN geo::distance($london, $paris);
`,
			js: `
import { GeometryPoint } from 'surrealdb';

await db.create('city:london').content({
	name: 'London',
	location: new GeometryPoint(-0.118092, 51.509865),
});

const distance = await db.query(
	'RETURN geo::distance($a, $b)',
	{ a: new GeometryPoint(-0.118092, 51.509865), b: new GeometryPoint(2.352222, 48.856613) },
);
`,
			rust: `
db.query(r#"
	CREATE city:london SET name = "London", location = (-0.118092, 51.509865);
	RETURN geo::distance($a, $b);
"#)
.bind(("a", (-0.118092, 51.509865)))
.bind(("b", (2.352222, 48.856613)))
.await?;
`,
			py: `
from surrealdb import GeometryPoint

await db.create("city:london", {
	"name": "London",
	"location": GeometryPoint((-0.118092, 51.509865)),
})
`,
			go: `
surrealdb.Query[float64](ctx, db,
	"RETURN geo::distance($a, $b)",
	map[string]any{
		"a": models.NewGeometryPoint(-0.118092, 51.509865),
		"b": models.NewGeometryPoint(2.352222, 48.856613),
	},
)
`,
			java: `
db.query("""
	CREATE city:london SET name = "London", location = (-0.118092, 51.509865);
	RETURN geo::distance($a, $b);
""");
`,
			csharp: `
await db.RawQuery("""
	CREATE city:london SET name = "London", location = (-0.118092, 51.509865);
	RETURN geo::distance($a, $b);
""");
`,
		}),
		[],
	);

	return (
		<Article title="Geospatial">
			<Box>
				<Box component="p">
					Store <code>geometry</code> and <code>geography</code> values and query
					distances with <code>geo::</code> functions. Points use coordinate tuples or
					typed geometry objects in SDKs.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Geospatial"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
