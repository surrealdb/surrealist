const params = new URLSearchParams(location.search);

if (params.has("code")) {
	location.pathname = `/cloud?referrer=${params.get("code")}`;
} else {
	location.pathname = "/cloud";
}
