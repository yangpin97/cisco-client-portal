const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 9907;

// 配置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 配置body-parser解析JSON请求体
app.use(bodyParser.json());

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'img', 'qrcodes'));
  },
  filename: function (req, file, cb) {
    const type = req.body.type || 'unknown';
    const ext = path.extname(file.originalname);
    cb(null, `${type}-qr${ext}`);
  }
});

const upload = multer({ storage: storage });

// 初始化数据文件
const dataPath = path.join(__dirname, 'data.json');

// 初始数据
const initialData = {
  admin: {
    username: 'admin',
    password: '$2b$10$VYJQfQpQ9Y5Y5Y5Y5Y5Y5e7uXQZJZJZJZJZJZJZJZJZJZJZJZJZJ' // 密码是 'admin' 的哈希
  },
  texts: {
    title: 'Cisco Secure Client',
    subtitle: '安全连接，无处不在。下载适用于您设备的Cisco Secure Client客户端，轻松建立安全连接。',
    downloadSectionTitle: '选择您的平台下载',
    iosButtonText: 'iOS',
    androidButtonText: 'Android'
  },
  downloads: {
    windows: {
      amd: '',
      arm: ''
    },
    macos: {
      intel: '',
      arm: '',
      appStore: ''
    },
    linux: {
      deb: '',
      rpm: ''
    },
    ios: 'https://apps.apple.com/us/app/cisco-secure-client/id1135064690',
    android: {
      latest: '',
      old: ''
    }
  },
  manuals: {
    windows: '',
    macos: '',
    linux: '',
    ios: '',
    android: ''
  },
  qrcodes: {
    ios: 'img/ios-qr.png',
    android: 'img/android-qr.png'
  },
  otherClients: []
};

// 确保数据目录存在
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
}

// 读取数据
function readData() {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据失败:', error);
    return initialData;
  }
}

// 保存数据
function saveData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('保存数据失败:', error);
    return false;
  }
}

// API路由

// 获取所有数据
app.get('/api/data', (req, res) => {
  const data = readData();
  // 移除密码信息
  const { admin, ...publicData } = data;
  res.json(publicData);
});

// 管理员登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const data = readData();
  
  if (username === data.admin.username && bcrypt.compareSync(password, data.admin.password)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: '用户名或密码错误' });
  }
});

// 更新管理员信息
app.post('/api/update-admin', (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const data = readData();
  
  // 验证原密码（如果要修改密码）
  if (newPassword && !bcrypt.compareSync(oldPassword, data.admin.password)) {
    return res.json({ success: false, message: '原密码不正确' });
  }
  
  // 更新用户名
  data.admin.username = username;
  
  // 更新密码（如果提供了新密码）
  if (newPassword) {
    data.admin.password = bcrypt.hashSync(newPassword, 10);
  }
  
  if (saveData(data)) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// 更新文本内容
app.post('/api/update-texts', (req, res) => {
  const texts = req.body;
  const data = readData();
  
  data.texts = { ...data.texts, ...texts };
  
  if (saveData(data)) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// 更新下载链接
app.post('/api/update-downloads', (req, res) => {
  const downloads = req.body;
  const data = readData();
  
  data.downloads = { ...data.downloads, ...downloads };
  
  if (saveData(data)) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// 更新手册链接
app.post('/api/update-manuals', (req, res) => {
  const manuals = req.body;
  const data = readData();
  
  data.manuals = { ...data.manuals, ...manuals };
  
  if (saveData(data)) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// 上传二维码
app.post('/api/upload-qr', upload.single('qrImage'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '未上传文件' });
  }
  
  const type = req.body.type;
  const data = readData();
  
  if (type === 'ios' || type === 'android') {
    data.qrcodes[type] = `img/qrcodes/${req.file.filename}`;
    
    if (saveData(data)) {
      return res.json({ 
        success: true, 
        path: data.qrcodes[type] 
      });
    }
  }
  
  res.json({ success: false, message: '上传失败' });
});

// 添加其他客户端
app.post('/api/add-client', (req, res) => {
  const { name, os, url, manual } = req.body;
  const data = readData();
  
  if (!data.otherClients) {
    data.otherClients = [];
  }
  
  data.otherClients.push({ name, os, url, manual });
  
  if (saveData(data)) {
    res.json({ success: true, clients: data.otherClients });
  } else {
    res.json({ success: false });
  }
});

// 更新其他客户端
app.post('/api/update-client', (req, res) => {
  const { index, name, os, url, manual } = req.body;
  const data = readData();
  
  if (!data.otherClients || index < 0 || index >= data.otherClients.length) {
    return res.json({ success: false, message: '客户端不存在' });
  }
  
  data.otherClients[index] = { name, os, url, manual };
  
  if (saveData(data)) {
    res.json({ success: true, clients: data.otherClients });
  } else {
    res.json({ success: false });
  }
});

// 删除其他客户端
app.post('/api/remove-client', (req, res) => {
  const { index } = req.body;
  const data = readData();
  
  if (!data.otherClients || index < 0 || index >= data.otherClients.length) {
    return res.json({ success: false, message: '客户端不存在' });
  }
  
  data.otherClients.splice(index, 1);
  
  if (saveData(data)) {
    res.json({ success: true, clients: data.otherClients });
  } else {
    res.json({ success: false });
  }
});

// 所有其他路由返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
    
