import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsDataModelsTimeSeries({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Time-series table with timestamp record IDs
CREATE sensor_readings:[location, sensor, time::now()] SET
	temperature_celsius = 22.5;

-- Pre-computed daily aggregates via a table view
DEFINE TABLE daily_measurements AS
	SELECT
		id[0] AS location,
		time::day(id[2]) AS day,
		math::mean(temperature_celsius) AS avg_temperature_celsius
	FROM sensor_readings
	GROUP BY id[0], time::day(id[2]);
`,
			js: `
await db.query(\`
	DEFINE TABLE daily_measurements AS
		SELECT
			id[0] AS location,
			time::day(id[2]) AS day,
			math::mean(temperature_celsius) AS avg_temperature_celsius
		FROM sensor_readings
		GROUP BY id[0], time::day(id[2]);
\`);
`,
			rust: `
db.query(r#"
	DEFINE TABLE daily_measurements AS
		SELECT
			id[0] AS location,
			time::day(id[2]) AS day,
			math::mean(temperature_celsius) AS avg_temperature_celsius
		FROM sensor_readings
		GROUP BY id[0], time::day(id[2]);
"#).await?;
`,
			py: `
await db.query("""
	DEFINE TABLE daily_measurements AS
		SELECT
			id[0] AS location,
			time::day(id[2]) AS day,
			math::mean(temperature_celsius) AS avg_temperature_celsius
		FROM sensor_readings
		GROUP BY id[0], time::day(id[2]);
""")
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, \`
	DEFINE TABLE daily_measurements AS
		SELECT
			id[0] AS location,
			time::day(id[2]) AS day,
			math::mean(temperature_celsius) AS avg_temperature_celsius
		FROM sensor_readings
		GROUP BY id[0], time::day(id[2]);
\`, nil)
`,
			java: `
db.query("""
	DEFINE TABLE daily_measurements AS
		SELECT
			id[0] AS location,
			time::day(id[2]) AS day,
			math::mean(temperature_celsius) AS avg_temperature_celsius
		FROM sensor_readings
		GROUP BY id[0], time::day(id[2]);
""");
`,
			csharp: `
await db.RawQuery("""
	DEFINE TABLE daily_measurements AS
		SELECT
			id[0] AS location,
			time::day(id[2]) AS day,
			math::mean(temperature_celsius) AS avg_temperature_celsius
		FROM sensor_readings
		GROUP BY id[0], time::day(id[2]);
""");
`,
			php: `
$db->query('
	DEFINE TABLE daily_measurements AS
		SELECT
			id[0] AS location,
			time::day(id[2]) AS day,
			math::mean(temperature_celsius) AS avg_temperature_celsius
		FROM sensor_readings
		GROUP BY id[0], time::day(id[2]);
');
`,
		}),
		[],
	);

	return (
		<Article title="Time series">
			<Box>
				<Box component="p">
					Model time-series data with timestamp-centric record IDs, table views for
					pre-computed aggregates, and <code>time::</code> functions for bucketing and
					windowing.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Time series"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
