// 全局数据存储，保存从服务器获取的数据
let appData = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否已登录
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        loadAdminData();
        showSection('adminSection');
    } else {
        showSection('loginSection');
    }
    
    // 绑定登录表单提交事件
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // 绑定退出登录事件
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // 绑定管理员信息表单提交事件
    document.getElementById('adminForm').addEventListener('submit', handleAdminUpdate);
    
    // 绑定文本内容表单提交事件
    document.getElementById('textsForm').addEventListener('submit', handleTextsUpdate);
    
    // 绑定下载链接表单提交事件
    document.getElementById('downloadsForm').addEventListener('submit', handleDownloadsUpdate);
    
    // 绑定手册链接表单提交事件
    document.getElementById('manualsForm').addEventListener('submit', handleManualsUpdate);
    
    // 绑定添加客户端按钮事件
    document.getElementById('addClientBtn').addEventListener('click', () => {
        document.getElementById('addClientFormContainer').classList.remove('hidden');
    });
    
    // 绑定取消添加客户端事件
    document.getElementById('cancelAddClient').addEventListener('click', () => {
        document.getElementById('addClientForm').reset();
        document.getElementById('addClientFormContainer').classList.add('hidden');
        document.getElementById('addClientMessage').classList.add('hidden');
    });
    
    // 绑定添加客户端表单提交事件
    document.getElementById('addClientForm').addEventListener('submit', handleAddClient);
    
    // 绑定保存所有按钮事件
    document.getElementById('saveAllBtn').addEventListener('click', saveAllChanges);
    
    // 绑定二维码上传事件
    document.getElementById('iosQrUpload').addEventListener('change', (e) => handleQrUpload(e, 'ios'));
    document.getElementById('androidQrUpload').addEventListener('change', (e) => handleQrUpload(e, 'android'));
});

// 显示指定区域，隐藏其他区域
function showSection(sectionId) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminSection').classList.add('hidden');
    document.getElementById(sectionId).classList.remove('hidden');
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('adminLoggedIn', 'true');
            loadAdminData();
            showSection('adminSection');
        } else {
            errorElement.textContent = result.message || '用户名或密码错误';
            errorElement.classList.remove('hidden');
        }
    } catch (error) {
        console.error('登录失败:', error);
        errorElement.textContent = '登录失败，请重试';
        errorElement.classList.remove('hidden');
    }
}

// 处理退出登录
function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    showSection('loginSection');
    document.getElementById('password').value = '';
    document.getElementById('loginError').classList.add('hidden');
}

// 从服务器加载管理员数据
async function loadAdminData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        appData = data;
        populateAdminForms(data); // 填充表单
    } catch (error) {
        console.error('加载数据失败:', error);
        showMessage(document.getElementById('adminUpdateMessage'), '加载数据失败，请刷新', 'error');
    }
}

// 填充表单数据
function populateAdminForms(data) {
    // 显示管理员用户名
//    document.getElementById('adminUsernameDisplay').textContent = `当前用户: ${data.admin?.username || 'admin'}`;
    
    // 管理员信息
    document.getElementById('adminUsername').value = data.admin?.username || '';
    
    // 文本内容
    document.getElementById('titleText').value = data.texts?.title || 'Cisco Secure Client';
    document.getElementById('subtitleText').value = data.texts?.subtitle || '安全连接，无处不在。下载适用于您设备的Cisco Secure Client客户端，轻松建立安全连接。';
    document.getElementById('downloadSectionTitleText').value = data.texts?.downloadSectionTitle || '选择您的平台下载';
//  document.getElementById('mobileDownloadTitle').value = data.texts?.mobileDownloadTitle || '移动端扫码下载';
    document.getElementById('iosButtonText').value = data.texts?.iosButtonText || 'iOS';
    document.getElementById('androidButtonText').value = data.texts?.androidButtonText || 'Android';
    document.getElementById('manualWindowsText').value = data.texts?.manualWindows || 'Windows 使用手册';
    document.getElementById('manualMacOSText').value = data.texts?.manualMacOS || 'macOS 使用手册';
    document.getElementById('manualLinuxText').value = data.texts?.manualLinux || 'Linux 使用手册';
    document.getElementById('manualIOSText').value = data.texts?.manualIOS || 'iOS 使用手册';
    document.getElementById('manualAndroidText').value = data.texts?.manualAndroid || 'Android 使用手册';
    
    // 下载链接
    document.getElementById('windowsAmdLink').value = data.downloads?.windows?.amd || '';
    document.getElementById('windowsArmLink').value = data.downloads?.windows?.arm || '';
    document.getElementById('macosIntelLink').value = data.downloads?.macos?.intel || '';
    document.getElementById('macosArmLink').value = data.downloads?.macos?.arm || '';
    document.getElementById('macosAppStoreLink').value = data.downloads?.macos?.appStore || '';
    document.getElementById('linuxDebLink').value = data.downloads?.linux?.deb || '';
    document.getElementById('linuxRpmLink').value = data.downloads?.linux?.rpm || '';
    document.getElementById('iosLink').value = data.downloads?.ios || 'https://apps.apple.com/us/app/cisco-secure-client/id1135064690';
    document.getElementById('androidLatestLink').value = data.downloads?.android?.latest || '';
    document.getElementById('androidOldLink').value = data.downloads?.android?.old || '';
    
    // 手册链接
    document.getElementById('manualWindowsLinkInput').value = data.manuals?.windows || '';
    document.getElementById('manualMacOSLinkInput').value = data.manuals?.macos || '';
    document.getElementById('manualLinuxLinkInput').value = data.manuals?.linux || '';
    document.getElementById('manualIOSLinkInput').value = data.manuals?.ios || '';
    document.getElementById('manualAndroidLinkInput').value = data.manuals?.android || '';
    
    // 二维码
    document.getElementById('iosQrPreview').src = data.qrcodes?.ios || 'img/ios-qr.png';
    document.getElementById('androidQrPreview').src = data.qrcodes?.android || 'img/android-qr.png';
    
    // 其他客户端
    populateOtherClients(data.otherClients || []);
}

// 填充其他客户端列表
function populateOtherClients(clients) {
    const container = document.getElementById('otherClientsContainer');
    container.innerHTML = '';
    
    if (clients.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">暂无其他开源客户端，点击下方按钮添加</p>';
        return;
    }
    
    clients.forEach((client, index) => {
        const clientDiv = document.createElement('div');
        clientDiv.className = 'bg-gray-50 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4';
        clientDiv.innerHTML = `
            <div>
                <h4 class="font-medium">${client.name}</h4>
                <p class="text-sm text-gray-600">适配系统: ${client.os || '未指定'}</p>
                <p class="text-sm text-gray-600 break-all">下载链接: ${client.url}</p>
                <p class="text-sm text-gray-600 break-all">使用手册: <a href="${client.manual || '#'}" target="_blank" class="text-blue-600 hover:underline">查看</a></p>
            </div>
            <button class="delete-client-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center" data-index="${index}">
                <i class="fa fa-trash mr-2"></i> 删除
            </button>
        `;
        container.appendChild(clientDiv);
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.delete-client-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteClient);
    });
}

// 处理管理员信息更新
async function handleAdminUpdate(e) {
    e.preventDefault();
    if (!appData) return;
    
    const username = document.getElementById('adminUsername').value;
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const messageElement = document.getElementById('adminUpdateMessage');
    
    // 验证：如果要修改密码，必须提供原密码
    if (newPassword && !oldPassword) {
        return showMessage(messageElement, '请输入原密码', 'error');
    }
    
    try {
        const response = await fetch('/api/update-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, oldPassword, newPassword })
        });
        
        const result = await response.json();
        
        if (result.success) {
            appData.admin = { ...appData.admin, username };
//            document.getElementById('adminUsernameDisplay').textContent = `当前用户: ${username}`;
            document.getElementById('oldPassword').value = '';
            document.getElementById('newPassword').value = '';
            showMessage(messageElement, '管理员信息更新成功', 'success');
        } else {
            showMessage(messageElement, result.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('管理员信息更新失败:', error);
        showMessage(messageElement, '更新失败，请重试', 'error');
    }
}

// 处理文本内容更新
async function handleTextsUpdate(e) {
    e.preventDefault();
    if (!appData) return;

    // 收集表单中的文本数据
    const textsData = {
        title: document.getElementById('titleText').value,
        subtitle: document.getElementById('subtitleText').value,
        downloadSectionTitle: document.getElementById('downloadSectionTitleText').value,
    //mobileDownloadTitle: document.getElementById('mobileDownloadTitle').value,
        iosButtonText: document.getElementById('iosButtonText').value,
        androidButtonText: document.getElementById('androidButtonText').value,
        manualWindows: document.getElementById('manualWindowsText').value,
        manualMacOS: document.getElementById('manualMacOSText').value,
        manualLinux: document.getElementById('manualLinuxText').value,
        manualIOS: document.getElementById('manualIOSText').value,
        manualAndroid: document.getElementById('manualAndroidText').value
    };

    try {
        const response = await fetch('/api/update-texts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(textsData)
        });

        const result = await response.json();
        if (result.success) {
            // 更新本地数据
            appData.texts = { ...appData.texts, ...textsData };
            showMessage(document.getElementById('textsUpdateMessage'), '文本内容更新成功', 'success');
            // 通知前端更新
            notifyFrontendUpdate();
        } else {
            showMessage(document.getElementById('textsUpdateMessage'), result.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('文本更新失败:', error);
        showMessage(document.getElementById('textsUpdateMessage'), '更新失败，请重试', 'error');
    }
}

// 处理下载链接更新
async function handleDownloadsUpdate(e) {
    e.preventDefault();
    if (!appData) return;

    // 收集下载链接数据
    const downloadsData = {
        windows: {
            amd: document.getElementById('windowsAmdLink').value,
            arm: document.getElementById('windowsArmLink').value
        },
        macos: {
            intel: document.getElementById('macosIntelLink').value,
            arm: document.getElementById('macosArmLink').value,
            appStore: document.getElementById('macosAppStoreLink').value
        },
        linux: {
            deb: document.getElementById('linuxDebLink').value,
            rpm: document.getElementById('linuxRpmLink').value
        },
        ios: document.getElementById('iosLink').value,
        android: {
            latest: document.getElementById('androidLatestLink').value,
            old: document.getElementById('androidOldLink').value
        }
    };

    try {
        const response = await fetch('/api/update-downloads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(downloadsData)
        });

        const result = await response.json();
        if (result.success) {
            appData.downloads = { ...appData.downloads, ...downloadsData };
            showMessage(document.getElementById('downloadsUpdateMessage'), '下载链接更新成功', 'success');
            // 通知前端更新
            notifyFrontendUpdate();
        } else {
            showMessage(document.getElementById('downloadsUpdateMessage'), result.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('下载链接更新失败:', error);
        showMessage(document.getElementById('downloadsUpdateMessage'), '更新失败，请重试', 'error');
    }
}

// 处理手册链接更新
async function handleManualsUpdate(e) {
    e.preventDefault();
    if (!appData) return;

    // 收集手册链接数据
    const manualsData = {
        windows: document.getElementById('manualWindowsLinkInput').value,
        macos: document.getElementById('manualMacOSLinkInput').value,
        linux: document.getElementById('manualLinuxLinkInput').value,
        ios: document.getElementById('manualIOSLinkInput').value,
        android: document.getElementById('manualAndroidLinkInput').value
    };

    try {
        const response = await fetch('/api/update-manuals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(manualsData)
        });

        const result = await response.json();
        if (result.success) {
            appData.manuals = { ...appData.manuals, ...manualsData };
            showMessage(document.getElementById('manualsUpdateMessage'), '手册链接更新成功', 'success');
            // 通知前端更新
            notifyFrontendUpdate();
        } else {
            showMessage(document.getElementById('manualsUpdateMessage'), result.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('手册链接更新失败:', error);
        showMessage(document.getElementById('manualsUpdateMessage'), '更新失败，请重试', 'error');
    }
}

// 处理添加客户端
async function handleAddClient(e) {
    e.preventDefault();
    if (!appData) return;

    const name = document.getElementById('clientName').value;
    const os = document.getElementById('clientOs').value;
    const url = document.getElementById('clientUrl').value;
    const manual = document.getElementById('clientManual').value;
    const messageElement = document.getElementById('addClientMessage');

    if (!name || !url) {
        return showMessage(messageElement, '客户端名称和下载链接为必填项', 'error');
    }

    const newClient = { name, os, url, manual };

    try {
        const response = await fetch('/api/add-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClient)
        });

        const result = await response.json();
        if (result.success) {
            appData.otherClients = [...(appData.otherClients || []), newClient];
            populateOtherClients(appData.otherClients);
            document.getElementById('addClientForm').reset();
            document.getElementById('addClientFormContainer').classList.add('hidden');
            showMessage(messageElement, '客户端添加成功', 'success');
            // 通知前端更新
            notifyFrontendUpdate();
        } else {
            showMessage(messageElement, result.message || '添加失败', 'error');
        }
    } catch (error) {
        console.error('添加客户端失败:', error);
        showMessage(messageElement, '添加失败，请重试', 'error');
    }
}

// 处理删除客户端
async function handleDeleteClient(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    if (!appData || !appData.otherClients || index < 0 || index >= appData.otherClients.length) return;

    try {
        const response = await fetch('/api/remove-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index })
        });

        const result = await response.json();
        if (result.success) {
            appData.otherClients.splice(index, 1);
            populateOtherClients(appData.otherClients);
            // 通知前端更新
            notifyFrontendUpdate();
        } else {
            alert(result.message || '删除失败，请重试');
        }
    } catch (error) {
        console.error('删除客户端失败:', error);
        alert('删除失败，请重试');
    }
}

// 处理二维码上传
async function handleQrUpload(e, type) {
    if (!appData || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('qrImage', file);
    formData.append('type', type);

    const preview = document.getElementById(`${type}QrPreview`);
    const message = document.getElementById(`${type}QrMessage`);

    try {
        const response = await fetch('/api/upload-qr', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            if (!appData.qrcodes) appData.qrcodes = {};
            appData.qrcodes[type] = result.path;
            preview.src = result.path;
            showMessage(message, `${type === 'ios' ? 'iOS' : 'Android'} 二维码更新成功`, 'success');
            // 通知前端更新
            notifyFrontendUpdate();
        } else {
            showMessage(message, '上传失败', 'error');
        }
    } catch (error) {
        console.error('二维码上传失败:', error);
        showMessage(message, '上传失败，请重试', 'error');
    }

    // 重置文件输入
    e.target.value = '';
}

// 保存所有修改
async function saveAllChanges() {
    if (!appData) return;

    // 依次调用各更新方法
    await handleTextsUpdate(new Event('submit'));
    await handleDownloadsUpdate(new Event('submit'));
    await handleManualsUpdate(new Event('submit'));
    
    // 显示全局成功消息
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = '所有修改已保存成功';
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
    
    // 通知前端更新
    notifyFrontendUpdate();
}

// 显示消息提示
function showMessage(element, text, type) {
    if (!element) return;
    
    element.textContent = text;
    element.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');
    
    if (type === 'success') {
        element.classList.add('bg-green-100', 'text-green-800');
    } else {
        element.classList.add('bg-red-100', 'text-red-800');
    }
    
    // 3秒后自动隐藏
    setTimeout(() => {
        element.classList.add('hidden');
    }, 3000);
}

// 通知前端页面更新数据
function notifyFrontendUpdate() {
    // 使用localStorage事件触发前端刷新
    localStorage.setItem('dataUpdated', Date.now().toString());
}
    
