const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 9907;

// Determine base directory for mutable data
// In pkg (executable), process.execPath is the path to the exe. We want the folder containing it.
// In normal node, __dirname is the project root.
const externalBaseDir = typeof process.pkg !== 'undefined' ? path.dirname(process.execPath) : __dirname;

// Ensure external public/img exists for uploads
const uploadDir = path.join(externalBaseDir, 'public', 'img');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Static files configuration
// 1. Serve from external directory first (allows user uploads and overrides)
app.use(express.static(path.join(externalBaseDir, 'public')));

// 2. If packaged, serve from internal snapshot as fallback
if (typeof process.pkg !== 'undefined') {
    app.use(express.static(path.join(__dirname, 'public')));
}

// 配置body-parser解析JSON请求体
app.use(bodyParser.json());

// 配置multer用于文件上传（修改上传路径和文件名规则）
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use the dynamic uploadDir
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 保留原始文件名（不进行重命名）
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// 初始化数据文件
const dataPath = path.join(externalBaseDir, 'data.json');

// 初始数据 (保留作为最后的 fallback)
const initialData = {
  admin: {
    username: 'admin',
    password: '$2a$10$7zc2W6OBSAElWz7FljChBOBFDG3.nObfbzJSXn6/LBVlu6gzFJKwu' // 密码是 'admin' 的哈希
  },
  // ... (Structure kept for safety, but content relies on data.json copy)
  texts: {},
  downloads: {},
  manuals: {},
  qrcodes: {},
  headerNav: {},
  banner: {}
};

// 确保数据文件存在
if (!fs.existsSync(dataPath)) {
  // 尝试从内部快照复制 data.json (Build-time data.json)
  const internalDataPath = path.join(__dirname, 'data.json');
  let initialized = false;

  if (fs.existsSync(internalDataPath)) {
      try {
          console.log('Initializing data.json from packaged default...');
          const content = fs.readFileSync(internalDataPath, 'utf8');
          fs.writeFileSync(dataPath, content);
          initialized = true;
      } catch (e) {
          console.error('Failed to copy internal data.json', e);
      }
  }

  // 如果复制失败，使用硬编码的初始数据
  if (!initialized) {
      console.log('Initializing data.json from hardcoded defaults...');
      fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
  }
}

// 读取数据
function readData() {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    const parsedData = JSON.parse(data);

    // 数据结构迁移：从 texts 迁移顶部导航数据到 headerNav
    if (!parsedData.headerNav && parsedData.texts) {
      parsedData.headerNav = {
        btn1: {
          text: parsedData.texts.headerBtn1Text || '飞将咨询',
          url: parsedData.texts.headerBtn1Url || '#',
          visible: parsedData.texts.headerBtn1Visible !== false
        },
        btn2: {
          text: parsedData.texts.headerBtn2Text || '飞将官网',
          url: parsedData.texts.headerBtn2Url || '#',
          visible: parsedData.texts.headerBtn2Visible !== false
        },
        btn3: {
          text: parsedData.texts.headerBtn3Text || '博客站',
          url: parsedData.texts.headerBtn3Url || '#',
          visible: parsedData.texts.headerBtn3Visible !== false
        }
      };
    }

    // Deep merge with initialData to ensure new fields exist
    const mergedData = {
        ...initialData,
        ...parsedData,
        texts: { ...initialData.texts, ...(parsedData.texts || {}) },
        headerNav: parsedData.headerNav || initialData.headerNav,
        banner: { ...initialData.banner, ...(parsedData.banner || {}) }, // Merge banner data
        downloads: { ...initialData.downloads, ...(parsedData.downloads || {}) },
        manuals: { ...initialData.manuals, ...(parsedData.manuals || {}) },
        qrcodes: { ...initialData.qrcodes, ...(parsedData.qrcodes || {}) }
    };

    // 数据结构迁移/修复：确保 manuals 中的 windows 是字符串，macos, linux 是对象结构
    if (typeof mergedData.manuals.windows === 'object' && mergedData.manuals.windows !== null) {
        // 如果是旧的对象结构，提取 link1 作为新的字符串值
        mergedData.manuals.windows = mergedData.manuals.windows.link1 || '';
    }

    if (typeof mergedData.manuals.macos === 'string') {
        mergedData.manuals.macos = { appStore: '', dmg: mergedData.manuals.macos };
    }
    if (typeof mergedData.manuals.linux === 'string') {
        mergedData.manuals.linux = { server: mergedData.manuals.linux, desktop: '' };
    }
    if (typeof mergedData.manuals.android === 'string') {
        mergedData.manuals.android = { latest: mergedData.manuals.android, old: '' };
    }

    return mergedData;
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

// 更新顶部导航配置
app.post('/api/update-header-nav', (req, res) => {
  try {
    const navData = req.body;
    const data = readData();
    // 深度合并或直接覆盖
    data.headerNav = { ...data.headerNav, ...navData };
    if (saveData(data)) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: '保存失败' });
    }
  } catch (error) {
    console.error('保存顶部导航失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新广告位配置
app.post('/api/update-banner', (req, res) => {
  try {
    const bannerData = req.body;
    const data = readData();
    data.banner = { ...data.banner, ...bannerData };
    if (saveData(data)) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: '保存失败' });
    }
  } catch (error) {
    console.error('保存广告位失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 上传二维码（修改路径存储逻辑）
app.post('/api/upload-qr', upload.single('qrImage'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '未上传文件' });
  }
  
  const type = req.body.type;
  const data = readData();
  
  if (type === 'ios' || type === 'android' || type === 'harmony' || type === 'consulting') {
    // 存储路径更新为 img/原始文件名（因上传到了public/img目录）
    data.qrcodes[type] = `img/${req.file.originalname}`;
    
    if (saveData(data)) {
      return res.json({ 
        success: true, 
        path: data.qrcodes[type] 
      });
    }
  }
  
  res.json({ success: false, message: '上传失败' });
});

// 上传通用图片（用于自定义按钮等）
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '未上传文件' });
  }
  
  // 返回相对路径
  res.json({ 
    success: true, 
    path: `img/${req.file.originalname}` 
  });
});

// 添加客户端 (支持 type 参数区分列表)
app.post('/api/add-client', (req, res) => {
  const { name, os, url, manual, icon, qrCode, type } = req.body;
  const data = readData();
  
  const targetList = type === 'custom' ? 'customClients' : 'openConnectClients';
  
  if (!data[targetList]) {
    data[targetList] = [];
  }
  
  data[targetList].push({ name, os, url, manual, icon, qrCode });
  
  if (saveData(data)) {
    res.json({ success: true, clients: data[targetList] });
  } else {
    res.json({ success: false });
  }
});

// 更新客户端
app.post('/api/update-client', (req, res) => {
  const { index, name, os, url, manual, icon, qrCode, type } = req.body;
  const data = readData();
  
  const targetList = type === 'custom' ? 'customClients' : 'openConnectClients';

  if (!data[targetList] || index < 0 || index >= data[targetList].length) {
    return res.json({ success: false, message: '客户端不存在' });
  }
  
  data[targetList][index] = { name, os, url, manual, icon, qrCode };
  
  if (saveData(data)) {
    res.json({ success: true, clients: data[targetList] });
  } else {
    res.json({ success: false });
  }
});

// 保存客户端列表排序
app.post('/api/save-clients', (req, res) => {
  const { clients, type } = req.body;
  const data = readData();
  
  const targetList = type === 'custom' ? 'customClients' : 'openConnectClients';
  
  data[targetList] = clients;
  
  if (saveData(data)) {
    res.json({ success: true, clients: data[targetList] });
  } else {
    res.json({ success: false });
  }
});

// 删除客户端
app.post('/api/remove-client', (req, res) => {
  const { index, type } = req.body;
  const data = readData();
  
  const targetList = type === 'custom' ? 'customClients' : 'openConnectClients';
  
  if (!data[targetList] || index < 0 || index >= data[targetList].length) {
    return res.json({ success: false, message: '客户端不存在' });
  }
  
  data[targetList].splice(index, 1);
  
  if (saveData(data)) {
    res.json({ success: true, clients: data[targetList] });
  } else {
    res.json({ success: false });
  }
});

// 管理后台页面路由
app.get('/login', (req, res) => {
  const externalPath = path.join(externalBaseDir, 'public', 'admin.html');
  const internalPath = path.join(__dirname, 'public', 'admin.html');
  
  if (fs.existsSync(externalPath)) {
    res.sendFile(externalPath);
  } else {
    res.sendFile(internalPath);
  }
});

// 所有其他路由返回index.html
app.get('*', (req, res) => {
  const externalPath = path.join(externalBaseDir, 'public', 'index.html');
  const internalPath = path.join(__dirname, 'public', 'index.html');
  
  if (fs.existsSync(externalPath)) {
    res.sendFile(externalPath);
  } else {
    res.sendFile(internalPath);
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});