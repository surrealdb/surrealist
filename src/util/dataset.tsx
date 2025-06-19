import { dedent } from "./dedent";

export interface DatasetQuery {
	name: string;
	query: string;
}

export const QUERY_ONE: DatasetQuery = {
	name: "Fetch products",
	query: dedent`
		# This query retrieves the first 10 products from the database

		SELECT * FROM product
		LIMIT 10;
	`,
};
