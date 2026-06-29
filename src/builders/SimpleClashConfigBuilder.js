import yaml from 'js-yaml';
import { deepCopy } from '../utils.js';
import { parseVless } from '../parsers/protocols/vlessParser.js';

const SIMPLE_CLASH_CONFIG = {
    'mixed-port': 7890,
    'allow-lan': true,
    'mode': 'Rule',
    'log-level': 'info',
    'unified-delay': true,
    'tcp-concurrent': true,
    'sniffer': {
        'enable': true,
        'sniff': {
            'HTTP': { 'ports': [80, 8080] },
            'TLS': { 'ports': [443, 8443] },
            'QUIC': { 'ports': [443, 8443] }
        },
        'skip-domain': ['Mijia Cloud']
    },
    'proxies': [],
    'proxy-groups': []
};

export class SimpleClashConfigBuilder {
    constructor(inputString, userAgent) {
        this.inputString = inputString;
        this.userAgent = userAgent;
        this.config = deepCopy(SIMPLE_CLASH_CONFIG);
        this.proxies = [];
    }

    async build() {
        await this.parseVlessLinks();
        this.addProxyGroups();
        this.addRules();
        return this.formatConfig();
    }

    async parseVlessLinks() {
        const input = this.inputString || '';
        const lines = input.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('vless://')) {
                try {
                    const proxy = parseVless(trimmedLine);
                    if (proxy && proxy.tag) {
                        const converted = this.convertProxy(proxy);
                        if (converted) {
                            this.addProxyWithDedup(converted);
                        }
                    }
                } catch (error) {
                    console.warn('Failed to parse VLESS link:', error.message);
                }
            }
        }
    }

    convertProxy(proxy) {
        const transportType = proxy.transport?.type || 'tcp';
        
        const result = {
            name: proxy.tag,
            type: 'vless',
            server: proxy.server,
            port: proxy.server_port,
            uuid: proxy.uuid,
            flow: proxy.flow || undefined,
            tls: proxy.tls?.enabled || false,
            servername: proxy.tls?.server_name || '',
            'client-fingerprint': proxy.tls?.utls?.fingerprint || 'chrome',
            network: transportType === 'xhttp' ? 'xhttp' : transportType,
        };

        // Reality options
        if (proxy.tls?.reality?.enabled) {
            result['reality-opts'] = {
                'public-key': proxy.tls.reality.public_key,
                'short-id': proxy.tls.reality.short_id,
            };
        }

        // Transport options
        if (transportType === 'ws') {
            result['ws-opts'] = {
                path: proxy.transport.path || '/',
                headers: proxy.transport.headers || {}
            };
        } else if (transportType === 'grpc') {
            result['grpc-opts'] = {
                'grpc-service-name': proxy.transport.service_name || ''
            };
        } else if (transportType === 'xhttp') {
            result['xhttp-opts'] = {
                path: proxy.transport.path || '/vless-xhttp',
                mode: 'auto'
            };
        }

        // Other options
        if (proxy.tcp_fast_open) {
            result.tfo = true;
        }
        if (proxy.tls?.insecure) {
            result['skip-cert-verify'] = true;
        }
        if (proxy.alpn && proxy.alpn.length > 0) {
            result.alpn = proxy.alpn;
        }

        return result;
    }

    addProxyWithDedup(proxy) {
        const existingIndex = this.config.proxies.findIndex(p => p.name === proxy.name);
        if (existingIndex >= 0) {
            const { name: _name, ...restOfNew } = proxy;
            const { name: __name, ...restOfExisting } = this.config.proxies[existingIndex];
            if (JSON.stringify(restOfNew) !== JSON.stringify(restOfExisting)) {
                let suffix = 2;
                let newName = `${proxy.name}_${suffix}`;
                while (this.config.proxies.some(p => p.name === newName)) {
                    suffix++;
                    newName = `${proxy.name}_${suffix}`;
                }
                proxy.name = newName;
                this.config.proxies.push(proxy);
            }
        } else {
            this.config.proxies.push(proxy);
        }
    }

    addProxyGroups() {
        const proxyNames = this.config.proxies.map(p => p.name);
        const subGroups = ['Streaming', 'AI', 'Microsoft', 'Telegram'];

        this.config['proxy-groups'].push(
            {
                type: 'select',
                name: 'PROXY',
                proxies: [...proxyNames, ...subGroups, 'DIRECT'],
                lazy: false
            },
            {
                type: 'select',
                name: 'Streaming',
                proxies: [...proxyNames, 'DIRECT']
            },
            {
                type: 'select',
                name: 'AI',
                proxies: [...proxyNames, 'DIRECT']
            },
            {
                type: 'select',
                name: 'Microsoft',
                proxies: ['DIRECT', ...proxyNames]
            },
            {
                type: 'select',
                name: 'Telegram',
                proxies: [...proxyNames, 'DIRECT']
            }
        );
    }

    addRules() {
        this.config.rules = [
            'GEOSITE,private,DIRECT',
            'GEOIP,private,DIRECT,no-resolve',
            'GEOSITE,category-ads-all,REJECT',
            'GEOSITE,cn,DIRECT',
            'GEOSITE,apple-cn,DIRECT',
            'GEOSITE,google-cn,DIRECT',
            'GEOSITE,category-games@cn,DIRECT',
            'DOMAIN-SUFFIX,microsoft.com,DIRECT',
            'DOMAIN-SUFFIX,windows.com,DIRECT',
            'DOMAIN-SUFFIX,windowsupdate.com,DIRECT',
            'DOMAIN-SUFFIX,office.net,DIRECT',
            'DOMAIN-SUFFIX,office.com,DIRECT',
            'DOMAIN-SUFFIX,live.com,DIRECT',
            'DOMAIN-SUFFIX,hotmail.com,DIRECT',
            'DOMAIN-SUFFIX,outlook.com,DIRECT',
            'DOMAIN-SUFFIX,msn.com,DIRECT',
            'DOMAIN-SUFFIX,skype.com,DIRECT',
            'DOMAIN-SUFFIX,azure.com,DIRECT',
            'DOMAIN-SUFFIX,azureedge.net,DIRECT',
            'DOMAIN-SUFFIX,windowsazure.com,DIRECT',
            'DOMAIN-SUFFIX,microsoftonline.com,DIRECT',
            'DOMAIN-SUFFIX,microsoft365.com,DIRECT',
            'DOMAIN-SUFFIX,xbox.com,DIRECT',
            'DOMAIN-SUFFIX,xboxlive.com,DIRECT',
            'DOMAIN-SUFFIX,gamepass.com,DIRECT',
            'DOMAIN-SUFFIX,qq.com,DIRECT',
            'DOMAIN-SUFFIX,weixin.qq.com,DIRECT',
            'DOMAIN-SUFFIX,taobao.com,DIRECT',
            'DOMAIN-SUFFIX,tmall.com,DIRECT',
            'DOMAIN-SUFFIX,alipay.com,DIRECT',
            'DOMAIN-SUFFIX,alibaba.com,DIRECT',
            'DOMAIN-SUFFIX,baidu.com,DIRECT',
            'DOMAIN-SUFFIX,bdstatic.com,DIRECT',
            'DOMAIN-SUFFIX,bilibili.com,DIRECT',
            'DOMAIN-SUFFIX,bilivideo.com,DIRECT',
            'DOMAIN-SUFFIX,hdslb.com,DIRECT',
            'DOMAIN-SUFFIX,163.com,DIRECT',
            'DOMAIN-SUFFIX,126.net,DIRECT',
            'DOMAIN-SUFFIX,netease.com,DIRECT',
            'DOMAIN-SUFFIX,douyin.com,DIRECT',
            'DOMAIN-SUFFIX,douban.com,DIRECT',
            'DOMAIN-SUFFIX,bytedance.com,DIRECT',
            'DOMAIN-SUFFIX,toutiao.com,DIRECT',
            'DOMAIN-SUFFIX,jd.com,DIRECT',
            'DOMAIN-SUFFIX,360buyimg.com,DIRECT',
            'DOMAIN-SUFFIX,meituan.com,DIRECT',
            'DOMAIN-SUFFIX,dianping.com,DIRECT',
            'DOMAIN-SUFFIX,zhihu.com,DIRECT',
            'DOMAIN-SUFFIX,zhimg.com,DIRECT',
            'DOMAIN-SUFFIX,weibo.com,DIRECT',
            'DOMAIN-SUFFIX,sinaimg.cn,DIRECT',
            'DOMAIN-SUFFIX,xiaomi.com,DIRECT',
            'DOMAIN-SUFFIX,mi.com,DIRECT',
            'DOMAIN-SUFFIX,pinduoduo.com,DIRECT',
            'DOMAIN-SUFFIX,kuaishou.com,DIRECT',
            'DOMAIN-SUFFIX,xiaohongshu.com,DIRECT',
            'DOMAIN-SUFFIX,snssdk.com,DIRECT',
            'DOMAIN-SUFFIX,pstatp.com,DIRECT',
            'DOMAIN-SUFFIX,feishu.cn,DIRECT',
            'DOMAIN-SUFFIX,larksuite.com,DIRECT',
            'DOMAIN-SUFFIX,dingtalk.com,DIRECT',
            'DOMAIN-SUFFIX,alipan.com,DIRECT',
            'DOMAIN-SUFFIX,aliyundrive.com,DIRECT',
            'DOMAIN-SUFFIX,iqiyi.com,DIRECT',
            'DOMAIN-SUFFIX,youku.com,DIRECT',
            'DOMAIN-SUFFIX,sohu.com,DIRECT',
            'DOMAIN-SUFFIX,aliyun.com,DIRECT',
            'DOMAIN-SUFFIX,tencent.com,DIRECT',
            'DOMAIN-SUFFIX,qcloud.com,DIRECT',
            'DOMAIN-SUFFIX,myqcloud.com,DIRECT',
            'DOMAIN-SUFFIX,cctv.com,DIRECT',
            'DOMAIN-SUFFIX,12306.cn,DIRECT',
            'DOMAIN-SUFFIX,ctrip.com,DIRECT',
            'GEOIP,CN,DIRECT,no-resolve',
            'GEOSITE,telegram,Telegram',
            'GEOSITE,openai,AI',
            'DOMAIN-SUFFIX,anthropic.com,AI',
            'DOMAIN-SUFFIX,claude.ai,AI',
            'DOMAIN-SUFFIX,oaistatic.com,AI',
            'DOMAIN-SUFFIX,oaiusercontent.com,AI',
            'DOMAIN-SUFFIX,cursor.sh,AI',
            'DOMAIN-SUFFIX,cursor.com,AI',
            'GEOSITE,google,PROXY',
            'GEOSITE,github,PROXY',
            'GEOSITE,twitter,PROXY',
            'GEOSITE,facebook,PROXY',
            'GEOSITE,instagram,PROXY',
            'GEOSITE,reddit,PROXY',
            'GEOSITE,discord,PROXY',
            'GEOSITE,whatsapp,PROXY',
            'GEOSITE,netflix,Streaming',
            'GEOSITE,disney,Streaming',
            'GEOSITE,spotify,Streaming',
            'GEOSITE,youtube,Streaming',
            'GEOSITE,geolocation-!cn,PROXY',
            'MATCH,PROXY'
        ];
    }

    formatConfig() {
        return yaml.dump(this.config);
    }
}