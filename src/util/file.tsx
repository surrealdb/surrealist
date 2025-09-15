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

export function downloadRemoteFile(url: string, name: string) {
	const link = document.createElement("a");

	link.href = url;
	link.download = name;

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
