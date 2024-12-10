require('dotenv').config();
const axios = require('axios');
const {HttpsProxyAgent} = require('https-proxy-agent');
const key = process.env.KEY_PROXY;
const typeProxy = process.env.TYPE_PROXY;
let cachedProxies = null;

async function getProxy() {
    const typesArray = JSON.parse(typeProxy);
    let allProxies = [];

    for (const typeProxy of typesArray) {
        const url = `https://proxy.vn/api/listproxy.php?key=${key}&loaiproxy=${typeProxy}`;
        try {
            const response = await axios.get(url);

            if (!response.data || response.data.trim() === "") {
                console.warn(`Dữ liệu proxy từ ${typeProxy} rỗng, bỏ qua.`);
                continue;
            }

            const proxies = response.data
                .split('}{')
                .map((str, index, arr) => {
                    if (index === 0) return JSON.parse(`${str}}`);
                    if (index === arr.length - 1) return JSON.parse(`{${str}`);
                    return JSON.parse(`{${str}}`);
                });
            allProxies = [...allProxies, ...proxies];
        } catch (error) {
            console.error(`Lỗi khi lấy proxy từ ${typeProxy}:`, error.message);
        }
    }
    cachedProxies = allProxies
    return cachedProxies;
}
async function getProxiesData() {
    if (!cachedProxies) {
        console.log('Dữ liệu proxy đang cập nhật lại...');
        await getProxy();
    }
    return cachedProxies;
}

async function getRandomProxy() {
    const proxiesData = await getProxiesData();

    if (!proxiesData || proxiesData.length === 0) {
        console.error('Không có proxy nào để sử dụng');
        return null;
    }

    return proxiesData[Math.floor(Math.random() * proxiesData.length)];
}

async function randomProxy() {
    let proxyHost, proxyPort, proxyUser, proxyPassword;

    const proxyData = await getRandomProxy();
    if (!proxyData) {
        console.error('Không thể tạo proxy');
        return null;
    }
    if (typeof proxyData === 'string') {
        [proxyHost, proxyPort, proxyUser, proxyPassword] = proxyData.split(':');
    } else if (typeof proxyData === 'object') {
        const proxy = proxyData.proxy;
        [proxyHost, proxyPort, proxyUser, proxyPassword] = proxy.split(':');
    }
    const proxyUrl = `http://${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`;
    return new HttpsProxyAgent(proxyUrl);
}

async function checkProxy() {
    try {
        const proxy = await randomProxy();
        if (proxy) {
            await axios.get('https://api.ipify.org?format=json', {
                httpAgent: proxy,
                httpsAgent: proxy
            });

            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

module.exports = {randomProxy, checkProxy};
