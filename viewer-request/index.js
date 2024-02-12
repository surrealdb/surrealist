function handler(event) {

	let request = event.request;
	let host = request.headers.host.value;

	if (host !== 'dev.surrealist.app') {

		return {
			statusCode: 301,
			statusDescription: 'Moved Permanently',
			headers: {
				location: {
					value: `https://dev.surrealist.app${path}`
				}
			},
		};

	}

	switch (true) {
		case request.uri === '/embed':
			request.uri = '/embed.html';
			return request;
		case request.uri.includes('.') === false:
			request.uri = '/index.html';
			return request;
	}

	return request;

}
