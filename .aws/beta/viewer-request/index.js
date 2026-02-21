function redirect(path, host) {
	return {
		statusCode: 301,
		statusDescription: 'Moved Permanently',
		headers: {
			location: {
				value: `https://beta-app.surrealdb.com${path}`
			}
		},
	};
}

function handler(event) {

	let request = event.request;
	let host = request.headers.host.value;
	let path = request.uri.toLowerCase();

	if (host !== 'beta-app.surrealdb.com' && host !== 'beta.surrealist.app') {
		return redirect(path)
	}

	switch (true) {

		// Redirects
		case request.uri === '/embed/new':
			return redirect('/mini/new');

		case request.uri === '/embed':
			return redirect('/mini');

		// Rewrites
		case request.uri === '/mini':
			request.uri = '/mini/run/index.html';
			break;

		case request.uri === '/cloud/callback':
			request.uri = '/cloud/callback/index.html';
			break;

		case request.uri === '/referral':
			request.uri = '/cloud/referral/index.html';
			break;

		case request.uri.includes('.') === false:
			request.uri = '/index.html';
			break;
	}

	return request;

}
