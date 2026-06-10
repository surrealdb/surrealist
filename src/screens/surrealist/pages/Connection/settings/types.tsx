import type { UseQueryResult } from "@tanstack/react-query";
import type { CloudInstance, CloudOrganization, Connection } from "~/types";

export interface ConnectionSettingsTabProps {
	connection: Connection;
	instanceQuery: UseQueryResult<CloudInstance>;
	organisationQuery: UseQueryResult<CloudOrganization>;
}
