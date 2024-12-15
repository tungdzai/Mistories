require('dotenv').config();
const {getProxiesWw} = require('./wwproxy');
const {getProxyVN} = require('./proxyVN');

async function getProxiesData() {
    console.log('Dữ liệu proxy đang cập nhật lại...');
    let dataProxies
    dataProxies = await getProxiesWw()
    if (!dataProxies || dataProxies.length === 0) {
        dataProxies = await getProxyVN();
    }
    return dataProxies;
}

module.exports = {getProxiesData};
