const axios = require('axios');
const {promises: fs} = require("fs");
const {sendTelegramMessage} = require('./telegram');
const {getProxiesData} = require('./proxy');
const qs = require('querystring');
const {HttpsProxyAgent} = require('https-proxy-agent');
const timeout = 90000;

async function withTimeout(promise, ms) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout exceeded')), ms)
    );
    return Promise.race([promise, timeout]);
}

async function getProxies() {
    const proxiesData = await getProxiesData();
    if (!proxiesData || proxiesData.length === 0) {
        await sendTelegramMessage('Không có proxy nào khả dụng để sử dụng.');
        console.error('Không có proxy nào để sử dụng');
        return null;
    }
    console.log(`Số proxy hoạt động: ${proxiesData.length}`);
    return proxiesData;
}

async function httpsProxyAgent(proxy) {
    if (!proxy) return null;

    const [proxyHost, proxyPort, proxyUser, proxyPassword] = proxy.split(':');
    if (!proxyHost || !proxyPort) {
        console.error('⚠️ Proxy không đúng định dạng.');
        return null;
    }

    const proxyUrl = proxyUser && proxyPassword
        ? `http://${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`
        : `http://${proxyHost}:${proxyPort}`;
    return new HttpsProxyAgent(proxyUrl);
}

async function readCodesFromFile(path) {
    try {
        const data = await fs.readFile(path, 'utf-8');
        return data.split('\n').map(code => code.trim()).filter(code => code);
    } catch (error) {
        console.error('Lỗi khi đọc file:', error);
        return [];
    }
}

async function login(phone, agent) {
    try {
        const data = qs.stringify({
            name: 'HIEN',
            phone: phone
        });
        const response = await withTimeout(
            await axios.post('https://thmistoriapi.zalozns.net/backend-user/login/th', data, {
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                    'content-length': data.length.toString(),
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'origin': 'https://quatangmistori.thmilk.vn',
                    'priority': 'u=1, i',
                    'referer': 'https://quatangmistori.thmilk.vn/',
                    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'x-pgp-api-media': '1'
                },
                httpAgent: agent,
                httpsAgent: agent
            }),
            timeout
        )
        return response.data;

    } catch (error) {
        if (error.message === 'Timeout exceeded') {
            console.error('Hết thời gian chờ');
            return null;
        }
        console.error('Đăng nhập không thành công:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function checkCodeLucky(token, gift, agent) {
    try {
        const response = await withTimeout(
            await axios.get(`https://thmistoriapi.zalozns.net/campaigns/check-code-lucky/${gift}`, {
                headers: {
                    'Host': 'thmistoriapi.zalozns.net',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site',
                    'X-Pgp-Api-Media': '1',
                    'sec-ch-ua-mobile': '?0',
                    'X-Pgp-Api-Campaign': 'ha_noi',
                    'sec-ch-ua-platform': '"Windows"',
                    'Authorization': token,
                },
                httpAgent: agent,
                httpsAgent: agent
            }),
            timeout
        )

        return response.data
    } catch (error) {
        if (error.message === 'Timeout exceeded') {
            console.error('Hết thời gian check gift');
            return null;
        }
        console.error('Error Checking Code Lucky:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function receiveCoupon(tokenCoupon, agent) {

    try {
        const response = await withTimeout(
            await axios.post('https://thmistoriapi.zalozns.net/coupon/receive', 'lucky_wheel_delay=15', {
                headers: {
                    'Host': 'thmistoriapi.zalozns.net',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Authorization': tokenCoupon,
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site',
                    'X-Pgp-Api-Media': '1',
                    'X-Pgp-Api-Campaign': 'ha_noi',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'X-Pgp-Ip-Address': ''
                },
                httpAgent: agent,
                httpsAgent: agent
            }),
            timeout
        )

        return response.data
    } catch (error) {
        if (error.message === 'Timeout exceeded') {
            console.error('Hết thời gian receive Coupon');
            return null;
        }
        console.error('Error Receiving Coupon:', error.response ? error.response.data : error.message);
        return null
    }
}

async function deliverCoupon(tokenCoupon, coupon, agent) {
    try {
        const response = await withTimeout(
            await axios.post(`https://thmistoriapi.zalozns.net/coupon-users/delivery/${coupon}`, {}, {
                headers: {
                    'Host': 'thmistoriapi.zalozns.net',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                    'Authorization': tokenCoupon,
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site',
                    'X-Pgp-Api-Media': '1',
                    'sec-ch-ua-mobile': '?0',
                    'X-Pgp-Api-Campaign': 'HANOI',
                    'sec-ch-ua-platform': '"Windows"',
                },
                httpAgent: agent,
                httpsAgent: agent
            }),
            timeout
        )
        return response.data
    } catch (error) {
        if (error.message === 'Timeout exceeded') {
            console.error('Hết thời gian Delivery Coupon');
            return null;
        }
        console.error('Error Delivery Coupon:', error.response ? error.response.data : error.message);
        return null
    }
}

async function checkProxiesAndRun() {
    const phones = await readCodesFromFile('./data/phone.txt');
    const codes = await readCodesFromFile('./data/quatangmistori.txt');
    const batchSize = 30;

    for (let i = 0; i < codes.length; i += batchSize) {
        const proxies = (await getProxies()).slice(0, batchSize);
        const batchGift = codes.slice(i, i + batchSize);

        const pairedProxiesAndGifts = batchGift.map((gift, index) => ({
            gift,
            proxy: proxies[index] || proxies[index % proxies.length],
        }));

        console.log('Processing batch:', pairedProxiesAndGifts);

        const batchPromises = pairedProxiesAndGifts.map(async ({gift, proxy}) => {
            const agent = await httpsProxyAgent(proxy);
            if (!agent) {
                console.error(`Proxy "${proxy}" could not be used.`);
                return null;
            }
            try {
                const phone = `0${phones[Math.floor(Math.random() * phones.length)]}`;
                const loginResponse = await withTimeout(login(phone, agent), timeout);
                if (!loginResponse || !loginResponse.token) {
                    console.error(`Lỗi đăng nhập tại ${gift} using proxy ${proxy}`);
                    return null;
                }
                const token = loginResponse.token;
                const checkLuckyResponse = await withTimeout(checkCodeLucky(token, gift, agent), timeout);

                if (!checkLuckyResponse || !checkLuckyResponse.authorization) {
                    console.error(`Gift: ${gift}:${checkLuckyResponse.title}  `);
                    return null;
                }
                const tokenCoupon = checkLuckyResponse.authorization;
                const receiveResponse = await withTimeout(receiveCoupon(tokenCoupon, agent), timeout);

                if (receiveResponse && receiveResponse.is_topup) {
                    const code = receiveResponse.coupon_user.code;
                    const deliverResponse = await withTimeout(deliverCoupon(tokenCoupon, code, agent), timeout);
                    if (deliverResponse && deliverResponse.result_code === 100) {
                        const message = `${deliverResponse.title} ${phone} ${gift} ${receiveResponse.title}`;
                        console.log(message);
                        await sendTelegramMessage(message);
                    }
                } else {
                    console.log(gift, receiveResponse.result_code, receiveResponse.title)
                }
            } catch (error) {
                console.error(`Lỗi khi xử lý gift "${gift}":`, error.message);
            }

        });
        try {
            // Chạy batch với timeout
            await withTimeout(Promise.all(batchPromises), timeout);
        } catch (error) {
            console.error(`Batch bị treo và đã bị bỏ qua:`, error.message);
        }
    }
}

checkProxiesAndRun()