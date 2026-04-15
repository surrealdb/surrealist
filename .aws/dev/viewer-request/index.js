function params(request) {
	var qs = [];

	for (var key in request.querystring) {
		if (request.querystring[key].multiValue) {
			request.querystring[key].multiValue.forEach((mv) => {
				qs.push(key + "=" + mv.value)
			});
		} else {
			qs.push(key + "=" + request.querystring[key].value);
		}
	};
	
	return "?" + qs.sort().join('&');
}

function redirect(path, host) {
	return {
		statusCode: 301,
		statusDescription: 'Moved Permanently',
		headers: {
			location: {
				value: `https://dev-app.surrealdb.com${path}`
			}
		},
	};
}

function handler(event) {

	let request = event.request;
	let host = request.headers.host.value;
	let path = request.uri.toLowerCase();

	if (host !== 'dev-app.surrealdb.com' && host !== 'dev.surrealist.app') {
		return redirect(path)
	}

	switch (true) {

		// Redirects
		case request.uri === '/embed/new':
			return redirect('/mini/new');

		case request.uri === '/embed':
			return redirect('/mini');

		case request.uri === '/referral':
			return redirect('/o/default' + params(request));

		// Rewrites
		case request.uri === '/mini':
			request.uri = '/mini/run/index.html';
			break;

		case request.uri === '/auth/return':
			request.uri = '/auth/return/index.html';
			break;

		case request.uri === '/auth/launch':
			request.uri = '/auth/launch/index.html';
			break;

		case request.uri.includes('.') === false:
			request.uri = '/index.html';
			break;
	}

	return request;

}
