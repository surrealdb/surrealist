const { pathname } = location;
const pattern = /^\/referral\/(.+)$/;

if (pattern.test(pathname)) {
	const [, code] = pathname.match(pattern) ?? [];
	const referralCode = code;

	location.pathname = `/cloud?referrer=${referralCode}`;
} else {
	location.pathname = "/cloud";
}
