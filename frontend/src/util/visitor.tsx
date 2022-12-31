export function propertyVisitor(src: any, callback: (path: string[], value: any) => void) {
	const visit = (obj: any, path: string[]) => {
		if (obj === null || obj === undefined) {
			return;
		}

		if (typeof obj === 'object') {
			Object.keys(obj).forEach(key => {
				const value = obj[key];
				const newPath = [...path, key];

				if (typeof value === 'object') {
					visit(value, newPath);
				} else {
					callback(newPath, value);
				}
			});
		}
		
		if (Array.isArray(obj)) {
			obj.forEach((value, index) => {
				const newPath = [...path, index.toString()];

				if (typeof value === 'object') {
					visit(value, newPath);
				} else {
					callback(newPath, value);
				}
			});
		}
	};

	visit(src, []);
}