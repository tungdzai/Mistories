const fs = require('fs');

async function convertJson(path){
    fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
            console.error("Lỗi đọc file:", err);
            return;
        }

        try {
            const jsonData = JSON.parse(data);
            const messages = jsonData.messages;
            const codes = messages.map(message => {
                return message.text || null;
            }).filter(code => code !== null);

            console.log("Các mã quay tìm được:", codes.length);

            codes.forEach(code => {
                if (code.startsWith('YE')) {
                    fs.appendFile('./data/quatangyogurt.txt', code + '\n', (err) => {
                        if (err) {
                            console.error("Lỗi ghi file quatangyogurt.txt:", err);
                        }
                    });
                } else if (code.startsWith('TY')) {
                    fs.appendFile('./data/quatangtopkid.txt', code + '\n', (err) => {
                        if (err) {
                            console.error("Lỗi ghi file quatangtopkid.txt:", err);
                        }
                    });
                }else if (code.startsWith('MY')){
                    fs.appendFile('./data/quatangmistori.txt', code + '\n', (err) => {
                        if (err) {
                            console.error("Lỗi ghi file quatangtopkid.txt:", err);
                        }
                    });
                }
            });

        } catch (parseError) {
            console.error("Lỗi phân tích JSON:", parseError);
        }
    });
}

async function main(){
    await convertJson('./TelegramExport/result.json');
}
main()
