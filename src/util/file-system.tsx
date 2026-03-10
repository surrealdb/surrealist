import { FileFilter } from "~/adapter/base";

export type SaveContent = Blob | string | Response | null;
export type SaveContentProvider = () => Result<SaveContent>;

function mapFileFilter(filters: FileFilter[]): FilePickerAcceptType[] {
	return filters.map((f) => ({
		description: f.name,
		accept: {
			"text/plain": f.extensions.map((e) => `.${e}`) as any,
		},
	}));
}

export function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			const result = reader.result as string;
			const base64Content = result.split(",")[1];
			resolve(base64Content);
		};
		reader.onerror = (error) => reject(error);
	});
}

export async function createFileDefinition(
	input: Blob | string | Response,
	name: string,
): Promise<Blob> {
	const content = input instanceof Response ? await input.blob() : input;

	return new File([content], name, {
		type: content instanceof Blob ? content.type : "text/plain",
	});
}

export async function openAndWriteFile(
	content: SaveContent | SaveContentProvider,
	name?: string,
	filters?: FileFilter[],
): Promise<boolean> {
	if (!("showSaveFilePicker" in window)) {
		return false;
	}

	const fileHandle = await window.showSaveFilePicker({
		suggestedName: name,
		startIn: "downloads",
		types: filters ? mapFileFilter(filters) : undefined,
	});

	const writableStream = await fileHandle.createWritable();
	const result = typeof content === "function" ? await content() : content;

	if (!result) {
		throw new Error("File is empty");
	}

	if (result instanceof Response) {
		await result.body?.pipeTo(writableStream);
	} else {
		await writableStream.write(result);
	}

	return true;
}

export async function openAndReadFiles(
	filters?: FileFilter[],
	multiple?: boolean,
): Promise<File[] | false> {
	if (!("showOpenFilePicker" in window)) {
		return false;
	}

	const fileHandles = await window.showOpenFilePicker({
		multiple: multiple ?? false,
		startIn: "downloads",
		types: filters ? mapFileFilter(filters) : undefined,
	});

	return Promise.all(fileHandles.map((fileHandle) => fileHandle.getFile()));
}
