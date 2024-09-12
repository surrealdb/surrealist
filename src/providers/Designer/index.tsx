import { useDisclosure } from "@mantine/hooks";
import {
	type PropsWithChildren,
	createContext,
	useContext,
	useMemo,
	useState,
} from "react";
import { useImmer } from "use-immer";
import { useMinimumVersion } from "~/hooks/connection";
import { useSaveable } from "~/hooks/save";
import { useTables } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { executeQuery } from "~/screens/database/connection/connection";
import type { TableInfo } from "~/types";
import { showError } from "~/util/helpers";
import { syncConnectionSchema } from "~/util/schema";
import { SDB_2_0_0 } from "~/util/versions";
import { DesignDrawer } from "./drawer";
import { buildDefinitionQueries, isSchemaValid } from "./helpers";

type DesignFunction = (table: string) => void;
type StopDesignFunction = () => void;

const DesignerContext = createContext<{
	active: string | null;
	isDesigning: boolean;
	design: DesignFunction;
	stopDesign: StopDesignFunction;
} | null>(null);

const DEFAULT_DEF: TableInfo = {
	schema: {
		name: "",
		drop: false,
		full: false,
		kind: {
			kind: "ANY",
		},
		permissions: {
			select: true,
			create: true,
			update: true,
			delete: true,
		},
	},
	fields: [],
	indexes: [],
	events: [],
};

/**
 * Access the design function
 */
export function useDesigner() {
	const ctx = useContext(DesignerContext);

	return (
		ctx ?? {
			active: null,
			isDesigning: false,
			design: () => {},
			stopDesign: () => {},
		}
	);
}

export function DesignerProvider({ children }: PropsWithChildren) {
	const tables = useTables();

	const [isDesigning, designingHandle] = useDisclosure();
	const [errors, setErrors] = useState<string[]>([]);
	const [data, setData] = useImmer<TableInfo>(DEFAULT_DEF);
	const [useOverwrite] = useMinimumVersion(SDB_2_0_0);

	const design = useStable((table: string) => {
		const schema = tables.find((t) => t.schema.name === table);

		if (!schema) {
			throw new Error(`Could not find table ${table}`);
		}

		setData(schema);
		setErrors([]);
		saveHandle.track();
		designingHandle.open();
	});

	const closeDrawer = useStable((force?: boolean) => {
		if (saveHandle.isChanged && !force) {
			return;
		}

		designingHandle.close();
	});

	const isValid = useMemo(() => {
		return data ? isSchemaValid(data) : true;
	}, [data]);

	const saveHandle = useSaveable({
		valid: isValid,
		track: {
			data,
		},
		onSave: async ({ data: previous }) => {
			if (!previous) {
				throw new Error("Could not determine previous state");
			}

			const query = buildDefinitionQueries({
				previous: previous,
				current: data,
				useOverwrite,
			});

			try {
				const res = await executeQuery(query);
				const errors = res.flatMap((r) => {
					if (r.success) return [];

					return [
						(r.result as string).replace(
							"There was a problem with the database: ",
							"",
						),
					];
				});

				setErrors(errors);

				if (errors.length > 0) {
					return false;
				}

				syncConnectionSchema({
					tables: [data.schema.name],
				});

				designingHandle.close();
			} catch (err: any) {
				showError({
					title: "Failed to apply schema",
					subtitle: err.message,
				});
			}
		},
		onRevert({ data }) {
			setData(data);
		},
	});

	return (
		<DesignerContext.Provider
			value={{
				design,
				isDesigning,
				stopDesign: designingHandle.close,
				active: data.schema.name,
			}}
		>
			{children}

			<DesignDrawer
				opened={isDesigning}
				onClose={closeDrawer}
				errors={errors}
				handle={saveHandle}
				onChange={setData}
				value={data}
			/>
		</DesignerContext.Provider>
	);
}
