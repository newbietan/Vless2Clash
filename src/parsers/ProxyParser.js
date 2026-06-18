import { parseVless } from './protocols/vlessParser.js';

const protocolParsers = {
    vless: parseVless
};

export class ProxyParser {
    static async parse(url, userAgent) {
        if (!url || typeof url !== 'string') {
            return undefined;
        }
        const trimmed = url.trim();
        const type = trimmed.split('://')[0];
        const parser = protocolParsers[type];
        if (!parser) {
            return undefined;
        }
        return parser(trimmed, userAgent);
    }
}