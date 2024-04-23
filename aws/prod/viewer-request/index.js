function redirect(path) {
    return {
		statusCode: 301,
		statusDescription: 'Moved Permanently',
		headers: {
			location: {
				value: `https://surrealist.app${path}`
			}
		},
	};
}

function handler(event) {

	let request = event.request;
	let host = request.headers.host.value;
	let path = request.uri.toLowerCase();

	if (host !== 'surrealist.app') {
		return redirect(path)
	}

	switch (true) {
	    case request.uri === '/embed/new':
	        return redirect('/mini/new');
	    case request.uri === '/embed':
	        return redirect('/mini');
		case request.uri === '/mini/new':
			request.uri = '/mini/new.html';
			return request;
		case request.uri === '/mini':
			request.uri = '/mini/run.html';
			return request;
		case request.uri.includes('.') === false:
			request.uri = '/index.html';
			return request;
	}

	return request;

}
