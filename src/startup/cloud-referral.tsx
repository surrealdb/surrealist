const params = new URLSearchParams(location.search);

if (params.has("code")) {
	location.href = `${location.origin}/cloud?referrer=${params.get("code")}`;
} else {
	location.href = `${location.origin}/cloud`;
}
