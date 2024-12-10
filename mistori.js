const axios = require('axios');
const {promises: fs} = require("fs");
const https = require('https');
const cheerio = require("cheerio");
const {getRandomTime, generateRandomPhone, generateRandomUserName, getRandomProvinceCode} = require('./handlers');
const {sendTelegramMessage} = require('./telegram');
const {randomProxy, checkProxy, batchSize} = require('./proxy');

const agent = new https.Agent({rejectUnauthorized: false});

async function readCodesFromFile(path) {
    try {
        const data = await fs.readFile(path, 'utf-8');
        return data.split('\n').map(code => code.trim()).filter(code => code);
    } catch (error) {
        console.error('Lỗi khi đọc file:', error);
        return [];
    }
}

async function login(phone, proxy, retries = 3) {
    if (retries < 0) {
        return null
    }
    if (retries < 3) {
        await getRandomTime(3000, 5000)
    }
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
                httpsAgent: proxy,
                httpAgent: proxy
            }
        );
        return response.data
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
        return await login(phone, proxy, retries - 1)
    }
}

async function checkCodeLucky(token, gift, proxy, retries = 3) {
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
            httpsAgent: proxy,
            httpAgent: proxy
        });
        return response.data

    } catch (error) {
        console.error('Error Checking Code Lucky:', error.response ? error.response.data : error.message);
        return checkCodeLucky(token, gift, proxy, retries - 1)
    }
}

async function receiveCoupon(tokenCoupon, proxy, retries = 3) {
    if (retries < 0) {
        return null
    }
    if (retries < 3) {
        await getRandomTime(3000, 5000)
    }
    try {
        const response = await axios.post(
            'https://thmistoriapi.zalozns.net/coupon/receive',
            'lucky_wheel_delay=15',
            {
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
                httpsAgent: proxy,
                httpAgent: proxy
            }
        );
        return response.data
    } catch (error) {
        console.error('Error Receiving Coupon:', error.response ? error.response.data : error.message);
        return await receiveCoupon(tokenCoupon, proxy, retries - 1);
    }
}

async function deliverCoupon(tokenCoupon, coupon, proxy, reties = 3) {
    if (reties < 0) {
        return null
    }
    if (reties < 3) {
        await getRandomTime(3000, 5000)
    }
    try {
        const response = await axios.post(
            `https://thmistoriapi.zalozns.net/coupon-users/delivery/${coupon}`,
            {},
            {
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
                httpsAgent: proxy,
                httpAgent: proxy
            }
        );
        return response.data
    } catch (error) {
        console.error('Error in Delivery Request:', error.response ? error.response.data : error.message);
        return await deliverCoupon(tokenCoupon, coupon, proxy, reties - 1)
    }
}

async function historiesReward(phoneList, retries = 2) {
    if (retries < 0) {
        return null;
    }
    try {
        return `${phoneList[Math.floor(Math.random() * phoneList.length)]}`;
        // const phoneNumber = `0${phoneList[Math.floor(Math.random() * phoneList.length)]}`;
        // const campaignType = 0;
        // const page = 1;
        //
        // const response = await axios.get(`https://quatangmistori.thmilk.vn/customer`, {
        //     params: {
        //         campaign_type: campaignType,
        //         phone: phoneNumber,
        //         page: page
        //     },
        //     httpsAgent: agent
        // });
        // const html = response.data;
        // const $ = cheerio.load(html);
        // const winners = [];
        // $('table tbody tr').each((index, element) => {
        //     const row = $(element);
        //     const winner = {
        //         stt: row.find('td').eq(0).text().trim(),
        //         prize: row.find('td').eq(1).text().trim(),
        //         name: row.find('td').eq(3).text().trim(),
        //         phone: row.find('td').eq(4).text().trim()
        //     };
        //     winners.push(winner);
        // });
        // if (winners.length < 2) {
        //     return phoneNumber
        // }
        // console.log(`${phoneNumber} đã quá số lần`);
        // return await historiesReward(phoneList, retries - 1);
    } catch (error) {
        console.error('Error in histories Reward:', error.response ? error.response.data : error.message);
    }
}


async function sendDataToAPI() {
    const phoneList = await readCodesFromFile('./data/phone.txt');
    const listCodes = await readCodesFromFile('./data/quatangmistori.txt');
    const batch = 5;
    for (let i = 0; i < listCodes.length; i += batch) {
        const batchGift = listCodes.slice(i, i + batch);
        const batchPromises = batchGift.map(async (gift) => {
            const proxy = await randomProxy();
            const requestLogin = await login(await generateRandomPhone(), proxy);
            if (requestLogin && requestLogin.result_code === 100) {
                const token = requestLogin.token;
                if (token) {
                    const statusGift = await checkCodeLucky(token, gift, proxy);
                    if (statusGift && statusGift.result_code === 100) {
                        const phone = await historiesReward(phoneList);
                        console.log(phone)
                        const authToken = (await login(phone, proxy)).token;
                        const authCoupon = await checkCodeLucky(authToken, gift, proxy);
                        const tokenCoupon = authCoupon.authorization;
                        const receive = await receiveCoupon(tokenCoupon, proxy);
                        if (receive && receive.result_code === 100 && receive.coupon_user && receive.coupon_user.code) {
                            const coupon = receive.coupon_user.code;
                            const deliver = await deliverCoupon(tokenCoupon, coupon, proxy);
                            if (deliver && deliver.result_code === 100) {
                                const message = `${phone} ${gift} ${receive.title}`;
                                console.log(message);
                                await sendTelegramMessage(message);
                            } else {
                                console.log(deliver)
                            }
                        } else {
                            console.log(receive)
                        }

                    } else {
                        console.log(`${gift} ${statusGift.title}`)
                    }
                }

            }
        })
        await Promise.all(batchPromises);
        await getRandomTime(2000, 3000)
    }

}

sendDataToAPI()
