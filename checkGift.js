const axios = require('axios');
const {promises: fs} = require("fs");
const {getRandomTime, generateRandomPhone, generateRandomUserName} = require('./handlers');
const {getProxiesData} = require('./proxy');
const {HttpsProxyAgent} = require("https-proxy-agent");

async function getProxies() {
    const proxiesData = await getProxiesData();
    if (!proxiesData || proxiesData.length === 0) {
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
        const randomName = await generateRandomUserName();
        const nameParts = randomName.split(' ');
        const lastName = nameParts[0];
        const middleName = nameParts.slice(1, -1).join(' ');
        const firstName = nameParts[nameParts.length - 1];
        const data = `name=${lastName}+${middleName}+${firstName}&phone=0${phone}`;
        const response = await axios.post('https://thmistoriapi.zalozns.net/backend-user/login/th', data, {
                headers: {
                    'Host': 'thmistoriapi.zalozns.net',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site',
                    'X-Pgp-Api-Media': '1',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"'
                },
                httpsAgent: agent,
                httpAgent: agent
            }
        );
        if (response.data) {
            return response.data
        }
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
    }
}

async function checkCodeLucky(token, gift, agent, retries = 3) {
    if (retries < 0) {
        return null
    }
    if (retries < 3) {
        await getRandomTime(2000, 5000)
    }
    try {
        const response = await axios.get(`https://thmistoriapi.zalozns.net/campaigns/check-code-lucky/${gift}`, {
            headers: {
                'Host': 'thmistoriapi.zalozns.net',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Authorization': token,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site',
                'X-Pgp-Api-Media': '1',
                'sec-ch-ua-mobile': '?0',
                'X-Pgp-Api-Campaign': 'ha_noi',
                'sec-ch-ua-platform': '"Windows"'
            },
            httpsAgent: agent,
            httpAgent: agent
        });
        return response.data

    } catch (error) {
        console.error('Error Checking Code Lucky:', error.response ? error.response.data : error.message);
        return checkCodeLucky(token, gift, proxy, retries - 1)
    }
}

async function checkProxiesAndRun() {
    const codes = await readCodesFromFile('./data/input.txt');
    const batchSize = 20;
    let validCodes = [];
    let invalidCodes = [];

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
                const phoneNumber = await generateRandomPhone();
                const loginResponse = await login(phoneNumber, agent);
                if (!loginResponse || !loginResponse.token) {
                    invalidCodes.push(`${gift} lỗi đăng nhập `);
                    console.error(`Lỗi đăng nhập tại ${gift} using proxy ${proxy}`);
                    return null;
                }
                const token = loginResponse.token;
                const checkLuckyResponse = await checkCodeLucky(token, gift, agent);
                if (checkLuckyResponse && checkLuckyResponse.authorization) {
                    console.error(`Gift: ${gift}:${checkLuckyResponse.result_code} `);
                    validCodes.push(gift);
                } else {
                    invalidCodes.push(`${gift} ${checkLuckyResponse.result_code} ${checkLuckyResponse.title}`);
                    console.error(`Gift: ${gift}:${checkLuckyResponse.result_code} ${checkLuckyResponse.title}`);
                }
            } catch (error) {
                invalidCodes.push(`${gift} ${error.message}`);
                console.error(`Lỗi khi xử lý gift "${gift}":`, error.message);
            }

        });
        await Promise.all(batchPromises);

        try {
            if (validCodes.length > 0) {
                console.log(`Dang sách mã hợp lệ `, validCodes)
                await fs.appendFile('./data/quatangmistori.txt', validCodes.join('\n') + '\n');
                validCodes = [];
            }
            if (invalidCodes.length > 0) {
                console.log(`Dang sách mã lỗi `, invalidCodes)
                await fs.appendFile('./data/errors.txt', invalidCodes.join('\n') + '\n');
                invalidCodes = [];
            }
        } catch (error) {
            console.error('Lỗi khi ghi file:', error);
        }

        console.log('Đợi 10 giây trước khi xử lý batch tiếp theo...');
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

checkProxiesAndRun()