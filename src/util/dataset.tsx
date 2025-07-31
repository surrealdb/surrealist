import { DatasetType } from "~/types";
import { dedent } from "./dedent";

export interface DatasetQuery {
	name: string;
	query: string;
}

export const STORE_QUERIES: DatasetQuery[] = [
	{
		name: "Record links",
		query: dedent`
			-- Query 1: Using record links to select from the seller table 
			SELECT
				name,
				seller.name
			FROM product LIMIT 4;
		`,
	},
	{
		name: "Graph relations",
		query: dedent`
			-- Query 2: Using graph relations to select from the person and product table
			SELECT
				time.created_at as order_date,
				product_name,
				<-person.name as person_name,
				->product.details
			FROM order LIMIT 4;
		`,
	},
	{
		name: "Conditional filtering",
		query: dedent`
			-- Query 3: Conditional filtering based on an embedded object property.
			SELECT 
				name,
				email 
			FROM person 
			WHERE address.country ?= "England" LIMIT 4;	
		`,
	},
	{
		name: "Relation filtering",
		query: dedent`
			-- Query 4: Conditional filtering using relationships.
			SELECT * FROM review
			WHERE ->product.sub_category ?= "Activewear" LIMIT 4;
		`,
	},
	{
		name: "Counting",
		query: dedent`
			-- Query 5: Count orders based on order status
			SELECT count() FROM order
			WHERE order_status IN [ "processed", "shipped"]
			GROUP ALL LIMIT 4;
		`,
	},
	{
		name: "Unique items",
		query: dedent`
			-- Query 6: Get a deduplicated list of products that were ordered
			SELECT 
				array::distinct(product_name) as ordered_products
			FROM order
			GROUP ALL LIMIT 4;
		`,
	},
	{
		name: "Aggregation",
		query: dedent`
			-- Query 7: Get the average price per product category
			SELECT 
				->product.category AS product_category,
				math::mean(price) AS avg_price
			FROM order
			GROUP BY product_category
			ORDER BY avg_price DESC LIMIT 4;
		`,
	},
	{
		name: "Functions",
		query: dedent`
			-- Query 8: encapsulating logic in a function
			RETURN fn::number_of_unfulfilled_orders();
		`,
	},
	{
		name: "Function filtering",
		query: dedent`
			-- Query 9: using a custom fuction for currency conversion
			SELECT 
				product_name,
				fn::pound_to_usd(price) AS price_usd
			FROM order LIMIT 4;
		`,
	},
];

export const SAMPLE_QUERIES: Record<DatasetType, DatasetQuery[]> = {
	"surreal-deal-store": STORE_QUERIES,
	"surreal-deal-store-mini": STORE_QUERIES,
};
