import { CloudInstanceType } from "~/types";

export function computeStorageSize(type: CloudInstanceType | undefined) {
	if (!type) {
		return 0;
	}

	if (type.price_hour === 0) {
		return 1024;
	}

	return type.memory * 8;
}
