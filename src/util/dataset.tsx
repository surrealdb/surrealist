import { DatasetType } from "~/types";
import { dedent } from "./dedent";

export interface DatasetQuery {
	name: string;
	query: string;
}

export const SAMPLE_QUERIES: Record<DatasetType, DatasetQuery[]> = {
	"surreal-deal-store-mini": [
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
	],
};

export const SURREAL_START_BASICS = {
	name: "SurrealQL Basics",
	query: dedent`
		--  .d8888b.                                             888 8888888b.  888888b.
		-- d88P  Y88b                                            888 888  'Y88b 888  '88b
		-- Y88b.                                                 888 888    888 888  .88P
		--  'Y888b.   888  888 888d888 888d888  .d88b.   8888b.  888 888    888 8888888K.
		--     'Y88b. 888  888 888P'   888P'   d8P  Y8b     '88b 888 888    888 888  'Y88b
		--       '888 888  888 888     888     88888888 .d888888 888 888    888 888    888
		-- Y88b  d88P Y88b 888 888     888     Y8b.     888  888 888 888  .d88P 888   d88P
		--  'Y8888P'   'Y88888 888     888      'Y8888  'Y888888 888 8888888P'  8888888P'
		--
		-- Welcome to SurrealDB, a multi-model database combining document, graph,
		-- reltional, time-series and vector capabilities in one system, all powered
		-- by SurrealQL. Use it to build AI agents, real-time and event-driven systems,
		-- knowledge graphs, as a backend, a BaaS, or embed it directly into your apps
		-- One engine, every model.
		--
		-- Learn more at https://surrealdb.com/docs/surrealdb/introduction/start
		--
		-- *****************************************************************************

		-- ------------------------------------------------------------
		-- CRUD

		CREATE user:martin CONTENT { name: "martin" };
		CREATE user:ignacio CONTENT { name: "ignacio" };
		CREATE user:tobie; user:jaime;

		SELECT * FROM user;

		UPDATE user:martin SET lastname = "schaer";

		DELETE user:foo;

		-- ------------------------------------------------------------
		-- Relations through record links (simple, no metadata)
		-- Create teams
		CREATE team:green SET name = "Green";
		CREATE team:red SET name = "Red";
		UPDATE user:martin SET team = team:green;

		SELECT id, name, team.name FROM user;
		-- Show all properties inside team
		SELECT id, name, team.* FROM user;

		-- ------------------------------------------------------------
		-- Relations through graph edges (can containe metadata)
		RELATE user:martin->plays_for->team:green SET since = d'2025-10-23';
		RELATE user:ignacio->plays_for->team:green;
		RELATE user:tobie->plays_for->team:red;

		SELECT *, ->plays_for->team as team FROM user;

		// To learn more, go to SurrealDB University Fundamentals course:
		// https://surrealdb.com/learn/fundamentals
	`,
};

export const SURREAL_START_GRAPH_V2 = {
	name: "Graph Queries",
	query: dedent`
		-- ------------------------------------------------------------
		-- Graph queries

		// We'll create a graph and run different graph queries 
		{

			CREATE document:doc_1;
			CREATE document:doc_2;
			CREATE category:important;
			CREATE tag:red;
			CREATE tag:blue;
			CREATE container:parent_folder;
			CREATE container:folder_1;

			RELATE document:doc_1->in_category->category:important;

			RELATE document:doc_1->has_tag->tag:red;
			RELATE document:doc_1->has_tag->tag:blue;
			RELATE document:doc_2->has_tag->tag:red;

			RELATE container:folder_1->stored_in->container:parent_folder;
			RELATE document:doc_1->stored_in->container:folder_1;
			RELATE document:doc_2->stored_in->container:parent_folder;
		};

		"Docs by category:";
		SELECT *, <-in_category<-document AS docs FROM category;

		"Docs by tag:";
		SELECT *, <-has_tag<-document AS docs FROM tag;

		"Container relations:";
		SELECT *, <->stored_in AS relations FROM container FETCH relations;

		"Related nodes by document:";
		SELECT *, ->?->? AS related FROM document;

		"Recursive document path (fixed levels):";
		SELECT *,
			@.{1}(->stored_in->?) AS cont1,
			@.{2}(->stored_in->?) AS cont2,
			@.{3}(->stored_in->?) AS cont3
		FROM document;

		"Recursive document path:";
		SELECT @.{..}.{
			id,
			container: ->stored_in->container.@
		} FROM document;

		SELECT *, ->?->? FROM document;


		-- ------------------------------------------------------------
		-- Recursive query

		{
			CREATE |node:1..10|;

			FOR $node IN SELECT * FROM node {
			LET $next = type::thing("node", $node.id.id() + 1);
				RELATE $node->edge->$next SET read = rand::bool();
			};
		};

		"Recursive with filters:";
		SELECT @.{1..6}.{
			id,
			next: ->edge[WHERE read = true]->node.@
		} FROM node;


		-- ------------------------------------------------------------
		-- Collect with filter

		{
			DELETE a, edge;

			CREATE a:1 SET bool = true;
			CREATE a:2 SET bool = true;
			CREATE a:3 SET bool = true;
			CREATE a:4 SET bool = false;
			CREATE a:5 SET bool = true;

			RELATE a:1->edge->a:2;
			RELATE a:2->edge->a:3;
			RELATE a:3->edge->a:4;
			RELATE a:4->edge->a:5;

			RETURN a:1.{..+collect+inclusive}
						(->edge->a[?bool]);
		};

		// To learn more about graph queries go to Chapter 8 in Aeon's Surreal
		// Renaissance book: https://surrealdb.com/learn/book/chapter-08
	`,
};

export const SURREAL_START_GRAPH_V3 = {
	name: "Graph Queries",
	query: dedent`
		-- ------------------------------------------------------------
		-- Graph queries

		// We'll create a graph and run different graph queries 
		{

			CREATE document:doc_1;
			CREATE document:doc_2;
			CREATE category:important;
			CREATE tag:red;
			CREATE tag:blue;
			CREATE container:parent_folder;
			CREATE container:folder_1;

			RELATE document:doc_1->in_category->category:important;

			RELATE document:doc_1->has_tag->tag:red;
			RELATE document:doc_1->has_tag->tag:blue;
			RELATE document:doc_2->has_tag->tag:red;

			RELATE container:folder_1->stored_in->container:parent_folder;
			RELATE document:doc_1->stored_in->container:folder_1;
			RELATE document:doc_2->stored_in->container:parent_folder;
		};

		"Docs by category:";
		SELECT *, <-in_category<-document AS docs FROM category;

		"Docs by tag:";
		SELECT *, <-has_tag<-document AS docs FROM tag;

		"Container relations:";
		SELECT *, <->stored_in AS relations FROM container FETCH relations;

		"Related nodes by document:";
		SELECT *, ->?->? AS related FROM document;

		"Recursive document path (fixed levels):";
		SELECT *,
			@.{1}(->stored_in->?) AS cont1,
			@.{2}(->stored_in->?) AS cont2,
			@.{3}(->stored_in->?) AS cont3
		FROM document;

		"Recursive document path:";
		SELECT @.{..}.{
			id,
			container: ->stored_in->container.@
		} FROM document;

		SELECT *, ->?->? FROM document;


		-- ------------------------------------------------------------
		-- Recursive query

		{
			CREATE |node:1..10|;

			FOR $node IN SELECT * FROM node {
			LET $next = type::record("node", $node.id.id() + 1);
				RELATE $node->edge->$next SET read = rand::bool();
			};
		};

		"Recursive with filters:";
		SELECT @.{1..6}.{
			id,
			next: ->edge[WHERE read = true]->node.@
		} FROM node;


		-- ------------------------------------------------------------
		-- Collect with filter

		{
			DELETE a, edge;

			CREATE a:1 SET bool = true;
			CREATE a:2 SET bool = true;
			CREATE a:3 SET bool = true;
			CREATE a:4 SET bool = false;
			CREATE a:5 SET bool = true;

			RELATE a:1->edge->a:2;
			RELATE a:2->edge->a:3;
			RELATE a:3->edge->a:4;
			RELATE a:4->edge->a:5;

			RETURN a:1.{..+collect+inclusive}
						(->edge->a[?bool]);
		};

		// To learn more about graph queries go to Chapter 8 in Aeon's Surreal
		// Renaissance book: https://surrealdb.com/learn/book/chapter-08
	`,
};

export const SURREAL_START_VECTOR = {
	name: "Vector Queries",
	query: dedent`
		-- Prepare the table
		{
			DEFINE TABLE documents;
			DEFINE FIELD text ON documents TYPE string;
			DEFINE FIELD embedding ON documents TYPE array<float, 4>;
		};

		-- Vector index
		-- Reference: https://surrealdb.com/docs/surrealdb/reference-guide/vector-search
		DEFINE INDEX IF NOT EXISTS documents_vec_index
			ON TABLE documents
			FIELDS embedding
			MTREE DIMENSION 4 DIST COSINE TYPE F32
			CONCURRENTLY;

		-- Add some documents with their embeddings
		{
			CREATE documents CONTENT { text: "foo", embedding: [1f, 2f, 3f, 4f] };
			CREATE documents CONTENT { text: "bar", embedding: [2f, 2f, 2f, 2f] };
			CREATE documents CONTENT { text: "zar", embedding: [5f, 4f, 3f, 2f] };
		};

		-- Search query
		LET $vector = [1f, 1f, 1f, 1f];

		SELECT
			*,
			// knn() uses the distance function from the index
			(1 - vector::distance::knn()) AS score
			// while the following gets computed independently from the index
			// vector::similarity::cosine(embedding, $vector) AS similarity
			OMIT embedding // ignore the embedding in the result
			FROM documents
			WHERE embedding <|2|> $vector;

		-- This shows the index, in the 'indexes' attribute
		-- INFO FOR TABLE documents;


		-- ------------------------------------------------------------
		-- Functions
		// The above search query can be turned into a function for ease of use


		DEFINE FUNCTION OVERWRITE fn::search($vector: array<float>) {
			RETURN SELECT
			*,
			(1 - vector::distance::knn()) AS score
			OMIT embedding
			FROM documents
			WHERE embedding <|2|> $vector;
		};

		RETURN fn::search([1f, 2f, 3f, 4f]);

		-- Congratulations, you've finished the onboarding!
		-- Get your certificate by completing the SurrealDB University Fundamentals
		-- See more examples in:
		-- https://surrealdb.com/docs/labs?filters=demos%2Cexamples%2Csurrealdb+official
	`,
};
