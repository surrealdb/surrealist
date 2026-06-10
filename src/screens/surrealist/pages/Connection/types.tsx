import { UseQueryResult } from "@tanstack/react-query";
import { CloudInstance, CloudOrganization } from "~/types";

export interface ViewPageProps {
	instanceQuery: UseQueryResult<CloudInstance>;
	organisationQuery: UseQueryResult<CloudOrganization>;
}
