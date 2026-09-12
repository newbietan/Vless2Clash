const PATH_LENGTH = 7;

export function deepCopy(obj) {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}
	if (Array.isArray(obj)) {
		return obj.map((item) => deepCopy(item));
	}
	const newObj = {};
	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			newObj[key] = deepCopy(obj[key]);
		}
	}
	return newObj;
}

export function generateWebPath(length = PATH_LENGTH) {
	if (!Number.isInteger(length) || length <= 0) {
		throw new TypeError("Path length must be a positive integer");
	}

	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const maxUnbiasedValue = 256 - (256 % characters.length);
	let result = "";

	while (result.length < length) {
		const bytes = new Uint8Array(length - result.length);
		globalThis.crypto.getRandomValues(bytes);
		for (const byte of bytes) {
			if (byte < maxUnbiasedValue) {
				result += characters[byte % characters.length];
			}
		}
	}

	return result;
}

export function createTlsConfig(params) {
	let tls = { enabled: false };
	if (params.security && params.security !== "none") {
		const insecureValue =
			params.allowInsecure ?? params.insecure ?? params.allow_insecure;
		tls = {
			enabled: true,
			server_name: params.sni || params.host,
			insecure: parseBool(insecureValue, false),
			// utls: {
			//   enabled: true,
			//   fingerprint: "chrome"
			// },
		};
		if (params.security === "reality") {
			tls.reality = {
				enabled: true,
				public_key: params.pbk,
				short_id: params.sid,
			};
		}
	}
	return tls;
}

export function createTransportConfig(params) {
	return {
		type: params.type,
		path: params.path ?? undefined,
		mode: params.mode ?? undefined,
		...(params.host && { headers: { host: params.host } }),
		...(params.type === "grpc" && {
			service_name: params.serviceName ?? undefined,
		}),
	};
}

// Parse boolean value from various formats
export function parseBool(value, fallback = undefined) {
	if (value === undefined || value === null) return fallback;
	if (typeof value === "boolean") return value;
	const lowered = String(value).toLowerCase();
	if (lowered === "true" || lowered === "1") return true;
	if (lowered === "false" || lowered === "0") return false;
	return fallback;
}

// Parse comma-separated string to array
export function parseArray(value) {
	if (!value) return undefined;
	if (Array.isArray(value)) return value;
	return String(value)
		.split(",")
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

const REGION_PATTERNS = {
	US: ["us", "america", "美国"],
	JP: ["jp", "japan", "日本", "东京"],
	HK: ["hk", "hongkong", "香港"],
	SG: ["sg", "singapore", "新加坡", "狮城"],
	TW: ["tw", "taiwan", "台湾", "台北"],
	KR: ["kr", "korea", "韩国", "首尔"],
	DE: ["de", "germany", "德国"],
	GB: ["gb", "uk", "英国", "伦敦"],
};

// Guess geographical region by keywords in node name or server domain
export function guessRegion(server = "", name = "") {
	const lowerName = String(name).toLowerCase();
	const lowerServer = String(server).toLowerCase();

	for (const [region, patterns] of Object.entries(REGION_PATTERNS)) {
		if (patterns.some((p) => lowerName.includes(p) || lowerServer.includes(p))) {
			return region;
		}
	}

	return "OTHER";
}
