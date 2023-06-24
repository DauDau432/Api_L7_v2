const net = require('net');
const exec = require('child_process').execSync;

const socket_port = 3000;
const socket_token = "SOCKET_TOKEN";
const allowed_ips = ['1.1.1.1'];

const server = net.createServer((socket) => {

    const remoteAddress = socket.remoteAddress.replace(/^.*:/, '');
    if (!allowed_ips.includes(remoteAddress)) {
        console.log(`Connection from ${remoteAddress} not allowed`);
        socket.write('failed');
        socket.end();
        return;
    }
  
    socket.on('data', (data) => {
        try {
            const json = JSON.parse(Buffer.from(data.toString(), 'base64').toString());

            if (json.socket_token !== socket_token) {
                socket.write('failed');
                socket.end();
            }

            //khởi động cuộc tấn công
            exec(json.command, function (error, stdout, stderr) {});

            console.log(`bắt đầu tấn công vào ${json.host}`)
        
            socket.write('success');
        } catch (e) {
            console.log(`không bắt đầu tấn công được ${e}`)
        
            socket.write('failed');
            socket.end();
        }
    });

    socket.on('error', (err) => { });

    socket.on('close', () => { });
});

server.listen(socket_port, () => {
    console.log(`Máy chủ đang lắng nghe trên ${socket_port}`);
});
