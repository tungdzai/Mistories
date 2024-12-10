async function getRandomTime(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}
async function getRandomProvinceCode() {
    const provnceCode=['89','24','06','95','27','77','83','52','70','15']
    const randomIndex = Math.floor(Math.random() * provnceCode.length);
    return provnceCode[randomIndex];
}

async function generateRandomUserName() {
    const lastNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Võ", "Đặng"];
    const middleNames = ["Văn", "Hồng", "Minh", "Quang", "Thanh", "Anh"];
    const firstNames = ["Hùng", "Lan", "Anh", "Bình", "Dũng", "Sơn", "Phương"];

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    return `${getRandomElement(lastNames)} ${getRandomElement(middleNames)} ${getRandomElement(firstNames)}`;
}

async function generateRandomPhone() {
    const prefixes = ["096", "097", "098", "086", "032", "034", "035", "036"];

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateRandomDigits(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }

    return `${getRandomElement(prefixes)}${generateRandomDigits(7)}`;
}

module.exports = {
    generateRandomPhone,
    getRandomTime,
    generateRandomUserName,
    getRandomProvinceCode

};
