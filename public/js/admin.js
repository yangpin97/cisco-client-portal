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
    
    // 绑定顶部导航表单提交事件
    document.getElementById('headerNavForm').addEventListener('submit', handleHeaderNavUpdate);

    // 绑定广告位表单提交事件
    document.getElementById('bannerForm').addEventListener('submit', handleBannerUpdate);

    // 绑定文本内容表单提交事件
    document.getElementById('textsForm').addEventListener('submit', handleTextsUpdate);
    
    // 绑定下载链接表单提交事件
    document.getElementById('downloadsForm').addEventListener('submit', (e) => {
        handleDownloadsUpdate(e);
        // Also save texts because iOS download URL is in texts
        handleTextsUpdate(new Event('submit')); 
    });
    
    // 绑定手册链接表单提交事件
    document.getElementById('manualsForm').addEventListener('submit', handleManualsUpdate);
    
    // 绑定添加客户端按钮事件
    document.getElementById('addClientBtn').addEventListener('click', () => {
        document.getElementById('addClientFormContainer').classList.remove('hidden');
        document.getElementById('addClientFormTitle').textContent = '添加新客户端';
        document.getElementById('clientIndex').value = '-1';
        document.getElementById('addClientForm').reset();
        document.querySelector('#addClientForm button[type="submit"]').textContent = '添加';
        // Reset QR preview
        document.getElementById('clientQrPath').value = '';
        document.getElementById('clientQrPreview').classList.add('hidden');
        document.getElementById('clientQrPreview').src = '';
    });
    
    // 绑定取消添加客户端事件
    document.getElementById('cancelAddClient').addEventListener('click', () => {
        document.getElementById('addClientForm').reset();
        document.getElementById('addClientFormContainer').classList.add('hidden');
        document.getElementById('addClientMessage').classList.add('hidden');
        document.getElementById('clientIndex').value = '-1';
    });
    
    // 绑定添加客户端表单提交事件
    document.getElementById('addClientForm').addEventListener('submit', (e) => handleAddClient(e, 'openConnect'));
    
    // --- Custom Client Events ---
    // 绑定添加Custom客户端按钮事件
    document.getElementById('addCustomClientBtn').addEventListener('click', () => {
        document.getElementById('addCustomClientFormContainer').classList.remove('hidden');
        document.getElementById('addCustomClientFormTitle').textContent = '添加新客户端';
        document.getElementById('customClientIndex').value = '-1';
        document.getElementById('addCustomClientForm').reset();
        document.querySelector('#addCustomClientForm button[type="submit"]').textContent = '添加';
        // Reset QR preview
        document.getElementById('customClientQrPath').value = '';
        document.getElementById('customClientQrPreview').classList.add('hidden');
        document.getElementById('customClientQrPreview').src = '';
    });

    // 绑定取消添加Custom客户端事件
    document.getElementById('cancelAddCustomClient').addEventListener('click', () => {
        document.getElementById('addCustomClientForm').reset();
        document.getElementById('addCustomClientFormContainer').classList.add('hidden');
        document.getElementById('addCustomClientMessage').classList.add('hidden');
        document.getElementById('customClientIndex').value = '-1';
    });

    // 绑定添加Custom客户端表单提交事件
    document.getElementById('addCustomClientForm').addEventListener('submit', (e) => handleAddClient(e, 'custom'));

    // 绑定保存所有按钮事件
    document.getElementById('saveAllBtnTop').addEventListener('click', saveAllChanges);
    
    // 绑定二维码上传事件
    document.getElementById('iosQrUpload').addEventListener('change', (e) => handleQrUpload(e, 'ios'));
    document.getElementById('androidQrUpload').addEventListener('change', (e) => handleQrUpload(e, 'android'));
    document.getElementById('harmonyQrUpload').addEventListener('change', (e) => handleQrUpload(e, 'harmony'));
    document.getElementById('consultingQrUpload').addEventListener('change', (e) => handleQrUpload(e, 'consulting'));

    // 绑定客户端二维码上传事件 (OpenConnect)
    document.getElementById('clientQrUpload').addEventListener('change', (e) => handleClientQrUpload(e, 'clientQrPath', 'clientQrPreview'));
    
    // 绑定客户端二维码上传事件 (Custom)
    document.getElementById('customClientQrUpload').addEventListener('change', (e) => handleClientQrUpload(e, 'customClientQrPath', 'customClientQrPreview'));

    // 绑定广告位图片上传事件
    document.getElementById('bannerImageUpload').addEventListener('change', (e) => handleClientQrUpload(e, 'bannerImagePath', 'bannerImagePreview'));
});

// Helper for Client QR Upload
async function handleClientQrUpload(e, pathInputId, previewImgId) {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById(pathInputId).value = result.path;
            const preview = document.getElementById(previewImgId);
            preview.src = result.path;
            preview.classList.remove('hidden');
        } else {
            alert('上传失败: ' + result.message);
            e.target.value = '';
        }
    } catch (error) {
        console.error('上传出错:', error);
        alert('上传出错，请重试');
        e.target.value = '';
    }
}

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
    // 管理员信息
    document.getElementById('adminUsername').value = data.admin?.username || '';
    
    // 文本内容
    document.getElementById('titleText').value = data.texts?.title || 'Cisco Secure Client';
    
    // Header Buttons
    const nav = data.headerNav || {};
    // Button 1 (Consulting)
    document.getElementById('headerBtn1Text').value = nav.btn1?.text || '飞将咨询';
    document.getElementById('headerBtn1Visible').checked = nav.btn1?.visible !== false;
    document.getElementById('headerBtn1Url').value = nav.btn1?.url || '#';
    document.getElementById('consultingQrPreview').src = data.qrcodes?.consulting || '';
    
    // Button 2
    document.getElementById('headerBtn2Text').value = nav.btn2?.text || '飞将官网';
    document.getElementById('headerBtn2Url').value = nav.btn2?.url || '#';
    document.getElementById('headerBtn2Visible').checked = nav.btn2?.visible !== false;
    
    // Button 3
    document.getElementById('headerBtn3Text').value = nav.btn3?.text || '博客站';
    document.getElementById('headerBtn3Url').value = nav.btn3?.url || '#';
    document.getElementById('headerBtn3Visible').checked = nav.btn3?.visible !== false;

    // Banner Settings
    const banner = data.banner || {};
    document.getElementById('bannerVisible').checked = banner.visible !== false;
    document.getElementById('bannerLink').value = banner.link || '';
    document.getElementById('bannerText1').value = banner.text1 || '';
    document.getElementById('bannerText2').value = banner.text2 || '';
    document.getElementById('bannerText3').value = banner.text3 || '';
    document.getElementById('bannerText4').value = banner.text4 || '';
    document.getElementById('bannerImagePath').value = banner.image || '';
    document.getElementById('bannerImagePreview').src = banner.image || '';

    // Hero Section
    document.getElementById('vpnVersionInput').value = data.texts?.vpnVersion || 'v5.1.1.145';
    document.getElementById('uiVersionInput').value = data.texts?.uiVersion || 'v5.1.14.1452';
    document.getElementById('updateDateInput').value = data.texts?.updateDate || '2025-12-25';
    document.getElementById('heroBtnTextInput').value = data.texts?.heroBtnText || '立即下载';
    
    // Section & Footer
    document.getElementById('downloadSectionTitleText').value = data.texts?.downloadSectionTitle || '选择您的平台';
    document.getElementById('downloadSectionSubtitleInput').value = data.texts?.downloadSectionSubtitle || '支持全平台设备的无缝接入体验';
    document.getElementById('footerCopyrightInput').value = data.texts?.footerCopyright || '© 2025 Cisco Secure Client Navigation. Powered by BLOG.YYDY.LINK';
    
    // Buttons
    document.getElementById('commonDownloadTextInput').value = data.texts?.commonDownloadText || '下载';
    document.getElementById('commonManualTextInput').value = data.texts?.commonManualText || '手册';
    document.getElementById('iosButtonText').value = data.texts?.iosButtonText || 'App Store';
    document.getElementById('androidButtonText').value = data.texts?.androidButtonText || '下载 APK';
    
    // 下载链接
    document.getElementById('winAmdLatest').value = data.downloads?.windows?.amdLatest || '';
    document.getElementById('winAmdStable').value = data.downloads?.windows?.amdStable || '';
    document.getElementById('winArmLatest').value = data.downloads?.windows?.armLatest || '';
    document.getElementById('winArmStable').value = data.downloads?.windows?.armStable || '';
    document.getElementById('win7Amd').value = data.downloads?.windows?.win7Amd || '';
    document.getElementById('win7Arm').value = data.downloads?.windows?.win7Arm || '';
    
    document.getElementById('macIntel').value = data.downloads?.macos?.intel || '';
    document.getElementById('macSilicon').value = data.downloads?.macos?.silicon || '';
    document.getElementById('macOldOsx').value = data.downloads?.macos?.oldOsx || '';
    document.getElementById('macAppStore').value = data.downloads?.macos?.appStore || '';
    
    document.getElementById('linuxAmdDeb').value = data.downloads?.linux?.amdDeb || '';
    document.getElementById('linuxAmdRpm').value = data.downloads?.linux?.amdRpm || '';
    document.getElementById('linuxArmDeb').value = data.downloads?.linux?.armDeb || '';
    document.getElementById('linuxArmRpm').value = data.downloads?.linux?.armRpm || '';
    document.getElementById('linuxAmdOther').value = data.downloads?.linux?.amdOther || '';
    document.getElementById('linuxArmOther').value = data.downloads?.linux?.armOther || '';
    
    document.getElementById('iosDownloadUrl').value = data.texts?.iosDownloadUrl || '';
    document.getElementById('harmonyLink').value = data.downloads?.harmony || '';
    document.getElementById('androidLatestLink').value = data.downloads?.android?.latest || '';
    document.getElementById('androidOldLink').value = data.downloads?.android?.old || '';
    
    // 手册链接
    let winManualUrl = '';
    if (data.manuals?.windows && typeof data.manuals.windows === 'object') {
        winManualUrl = data.manuals.windows.link1 || '';
    } else {
        winManualUrl = data.manuals?.windows || '';
    }
    const winInput = document.getElementById('manualWindowsLinkInput');
    if (winInput) winInput.value = winManualUrl;
    
    // MacOS Manuals
    if (typeof data.manuals?.macos === 'object') {
        document.getElementById('manualMacAppStoreInput').value = data.manuals.macos.appStore || '';
        document.getElementById('manualMacDmgInput').value = data.manuals.macos.dmg || '';
    } else {
        document.getElementById('manualMacAppStoreInput').value = '';
        document.getElementById('manualMacDmgInput').value = data.manuals?.macos || '';
    }

    // Linux Manuals
    if (typeof data.manuals?.linux === 'object') {
        document.getElementById('manualLinuxServerInput').value = data.manuals.linux.server || '';
        document.getElementById('manualLinuxDesktopInput').value = data.manuals.linux.desktop || '';
    } else {
        document.getElementById('manualLinuxServerInput').value = data.manuals?.linux || '';
        document.getElementById('manualLinuxDesktopInput').value = '';
    }

    document.getElementById('manualIOSLinkInput').value = data.manuals?.ios || '';
    document.getElementById('manualHarmonyLinkInput').value = data.manuals?.harmony || '';
    
    // Android Manuals
    if (typeof data.manuals?.android === 'object') {
        document.getElementById('manualAndroidLatestInput').value = data.manuals.android.latest || '';
        document.getElementById('manualAndroidOldInput').value = data.manuals.android.old || '';
    } else {
        document.getElementById('manualAndroidLatestInput').value = data.manuals?.android || '';
        document.getElementById('manualAndroidOldInput').value = '';
    }
    
    // 二维码
    document.getElementById('iosQrPreview').src = data.qrcodes?.ios || 'img/ios-qr.png';
    document.getElementById('androidQrPreview').src = data.qrcodes?.android || 'img/android-qr.png';
    document.getElementById('harmonyQrPreview').src = data.qrcodes?.harmony || 'img/harmony-qr.png';
    
    // 其他客户端
    populateClientList(data.openConnectClients || [], 'otherClientsContainer', 'openConnect');
    // Custom客户端
    populateClientList(data.customClients || [], 'customClientsContainer', 'custom');
}

// 填充客户端列表 (Generic)
function populateClientList(clients, containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (clients.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">暂无客户端，点击上方按钮添加</p>';
        return;
    }
    
    clients.forEach((client, index) => {
        const clientDiv = document.createElement('div');
        clientDiv.className = 'bg-gray-50 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 group';
        
        const iconClass = client.icon || 'fa-globe';
        
        clientDiv.innerHTML = `
            <div class="flex items-center gap-4 overflow-hidden">
                <div class="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                    <i class="fa ${iconClass} text-2xl"></i>
                </div>
                <div class="min-w-0">
                    <h4 class="font-medium flex items-center gap-2 text-gray-900">
                        ${client.name}
                        <span class="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600 flex-shrink-0">${client.os || '通用'}</span>
                    </h4>
                    <p class="text-sm text-gray-500 truncate max-w-md">${client.url}</p>
                </div>
            </div>
            
            <div class="flex items-center gap-2 flex-shrink-0">
                <div class="flex flex-col gap-1 mr-2 border-r border-gray-200 pr-3">
                    <button type="button" class="move-client-btn text-gray-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors" data-index="${index}" data-direction="-1" data-type="${type}" ${index === 0 ? 'disabled' : ''} title="上移">
                        <i class="fa fa-chevron-up"></i>
                    </button>
                    <button type="button" class="move-client-btn text-gray-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors" data-index="${index}" data-direction="1" data-type="${type}" ${index === clients.length - 1 ? 'disabled' : ''} title="下移">
                        <i class="fa fa-chevron-down"></i>
                    </button>
                </div>
                <button type="button" class="edit-client-btn bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors" data-index="${index}" data-type="${type}">
                    <i class="fa fa-edit mr-1"></i> 编辑
                </button>
                <button type="button" class="delete-client-btn bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors" data-index="${index}" data-type="${type}">
                    <i class="fa fa-trash mr-1"></i> 删除
                </button>
            </div>
        `;
        container.appendChild(clientDiv);
    });
    
    // 绑定事件
    container.querySelectorAll('.edit-client-btn').forEach(btn => {
        btn.addEventListener('click', handleEditClient);
    });
    container.querySelectorAll('.delete-client-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteClient);
    });
    container.querySelectorAll('.move-client-btn').forEach(btn => {
        btn.addEventListener('click', handleMoveClient);
    });
}

// 保留旧函数名以防兼容，但重定向
function populateOtherClients(clients) {
    populateClientList(clients, 'otherClientsContainer', 'openConnect');
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

// 处理顶部导航更新
async function handleHeaderNavUpdate(e) {
    e.preventDefault();
    
    const navData = {
        btn1: {
            text: document.getElementById('headerBtn1Text').value,
            visible: document.getElementById('headerBtn1Visible').checked,
            url: document.getElementById('headerBtn1Url').value
        },
        btn2: {
            text: document.getElementById('headerBtn2Text').value,
            visible: document.getElementById('headerBtn2Visible').checked,
            url: document.getElementById('headerBtn2Url').value
        },
        btn3: {
            text: document.getElementById('headerBtn3Text').value,
            visible: document.getElementById('headerBtn3Visible').checked,
            url: document.getElementById('headerBtn3Url').value
        }
    };
    
    try {
        const response = await fetch('/api/update-header-nav', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(navData)
        });

        const result = await response.json();
        
        if (result.success) {
            if (appData) {
                appData.headerNav = { ...appData.headerNav, ...navData };
            }
            showMessage(document.getElementById('headerNavUpdateMessage'), '顶部导航更新成功', 'success');
            notifyFrontendUpdate();
        } else {
            showMessage(document.getElementById('headerNavUpdateMessage'), result.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('顶部导航更新失败:', error);
        showMessage(document.getElementById('headerNavUpdateMessage'), '更新失败，请重试', 'error');
    }
}

// 处理广告位更新
async function handleBannerUpdate(e) {
    e.preventDefault();
    
    const bannerData = {
        visible: document.getElementById('bannerVisible').checked,
        image: document.getElementById('bannerImagePath').value,
        link: document.getElementById('bannerLink').value,
        text1: document.getElementById('bannerText1').value,
        text2: document.getElementById('bannerText2').value,
        text3: document.getElementById('bannerText3').value,
        text4: document.getElementById('bannerText4').value
    };
    
    try {
        const response = await fetch('/api/update-banner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bannerData)
        });

        const result = await response.json();
        
        if (result.success) {
            if (appData) {
                appData.banner = { ...appData.banner, ...bannerData };
            }
            showMessage(document.getElementById('bannerUpdateMessage'), '广告位更新成功', 'success');
            notifyFrontendUpdate();
        } else {
            showMessage(document.getElementById('bannerUpdateMessage'), result.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('广告位更新失败:', error);
        showMessage(document.getElementById('bannerUpdateMessage'), '更新失败，请重试', 'error');
    }
}

// 处理文本内容更新
async function handleTextsUpdate(e) {
    e.preventDefault();
    if (!appData) return;

    // 收集表单中的文本数据
    const textsData = {
        title: document.getElementById('titleText').value,
        vpnVersion: document.getElementById('vpnVersionInput').value,
        uiVersion: document.getElementById('uiVersionInput').value,
        updateDate: document.getElementById('updateDateInput').value,
        heroBtnText: document.getElementById('heroBtnTextInput').value,
        downloadSectionTitle: document.getElementById('downloadSectionTitleText').value,
        downloadSectionSubtitle: document.getElementById('downloadSectionSubtitleInput').value,
        footerCopyright: document.getElementById('footerCopyrightInput').value,
        commonDownloadText: document.getElementById('commonDownloadTextInput').value,
        commonManualText: document.getElementById('commonManualTextInput').value,
        iosButtonText: document.getElementById('iosButtonText').value,
        androidButtonText: document.getElementById('androidButtonText').value,
        iosDownloadUrl: document.getElementById('iosDownloadUrl').value // Add custom iOS URL
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
            amdLatest: document.getElementById('winAmdLatest').value,
            amdStable: document.getElementById('winAmdStable').value,
            armLatest: document.getElementById('winArmLatest').value,
            armStable: document.getElementById('winArmStable').value,
            win7Amd: document.getElementById('win7Amd').value,
            win7Arm: document.getElementById('win7Arm').value
        },
        macos: {
            intel: document.getElementById('macIntel').value,
            silicon: document.getElementById('macSilicon').value,
            oldOsx: document.getElementById('macOldOsx').value,
            appStore: document.getElementById('macAppStore').value
        },
        linux: {
            amdDeb: document.getElementById('linuxAmdDeb').value,
            amdRpm: document.getElementById('linuxAmdRpm').value,
            armDeb: document.getElementById('linuxArmDeb').value,
            armRpm: document.getElementById('linuxArmRpm').value,
            amdOther: document.getElementById('linuxAmdOther').value,
            armOther: document.getElementById('linuxArmOther').value
        },
        ios: '', // Removed from UI
        harmony: document.getElementById('harmonyLink').value,
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
        macos: {
            appStore: document.getElementById('manualMacAppStoreInput').value,
            dmg: document.getElementById('manualMacDmgInput').value
        },
        linux: {
            server: document.getElementById('manualLinuxServerInput').value,
            desktop: document.getElementById('manualLinuxDesktopInput').value
        },
        ios: document.getElementById('manualIOSLinkInput').value,
        harmony: document.getElementById('manualHarmonyLinkInput').value,
        android: {
            latest: document.getElementById('manualAndroidLatestInput').value,
            old: document.getElementById('manualAndroidOldInput').value
        }
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

// 处理添加/更新客户端 (Local Only)
async function handleAddClient(e, type) {
    e.preventDefault();
    if (!appData) return;

    const prefix = type === 'custom' ? 'customClient' : 'client';
    const formId = type === 'custom' ? 'addCustomClientForm' : 'addClientForm';
    const containerId = type === 'custom' ? 'addCustomClientFormContainer' : 'addClientFormContainer';
    const messageId = type === 'custom' ? 'addCustomClientMessage' : 'addClientMessage';

    const index = parseInt(document.getElementById(`${prefix}Index`).value);
    const name = document.getElementById(`${prefix}Name`).value;
    const os = document.getElementById(`${prefix}Os`).value;
    const url = document.getElementById(`${prefix}Url`).value;
    const manual = document.getElementById(`${prefix}Manual`).value;
    const qrCode = document.getElementById(`${prefix}QrPath`).value;
    
    // Get selected icon
    const iconInput = document.querySelector(`input[name="${prefix}Icon"]:checked`);
    const icon = iconInput ? iconInput.value : 'fa-globe';
    
    const messageElement = document.getElementById(messageId);

    if (!name || !url) {
        return showMessage(messageElement, '客户端名称和下载链接为必填项', 'error');
    }

    const clientData = { name, os, url, manual, icon, qrCode, type };
    
    // Local Update Only
    const listKey = type === 'custom' ? 'customClients' : 'openConnectClients';
    const listContainerId = type === 'custom' ? 'customClientsContainer' : 'otherClientsContainer';
    const listType = type === 'custom' ? 'custom' : 'openConnect';

    if (index >= 0) {
            appData[listKey][index] = clientData;
            await saveClientList(listType, appData[listKey]);
            showMessage(messageElement, '客户端已更新', 'success');
    } else {
            if (!appData[listKey]) appData[listKey] = [];
            appData[listKey].push(clientData);
            await saveClientList(listType, appData[listKey]);
            showMessage(messageElement, '客户端已添加', 'success');
    }
    populateClientList(appData[listKey], listContainerId, listType);
    
    // Hide form after short delay
    setTimeout(() => {
        document.getElementById(containerId).classList.add('hidden');
        document.getElementById(formId).reset();
        messageElement.classList.add('hidden');
        document.getElementById(`${prefix}Index`).value = '-1';
    }, 1000);
}

// 处理编辑客户端
function handleEditClient(e) {
    const btn = e.currentTarget;
    const index = parseInt(btn.dataset.index);
    const type = btn.dataset.type; // 'openConnect' or 'custom'
    
    const listKey = type === 'custom' ? 'customClients' : 'openConnectClients';
    
    if (!appData || !appData[listKey] || index < 0 || index >= appData[listKey].length) return;
    
    const client = appData[listKey][index];
    const prefix = type === 'custom' ? 'customClient' : 'client';
    const formId = type === 'custom' ? 'addCustomClientForm' : 'addClientForm';
    const containerId = type === 'custom' ? 'addCustomClientFormContainer' : 'addClientFormContainer';
    const titleId = type === 'custom' ? 'addCustomClientFormTitle' : 'addClientFormTitle';

    document.getElementById(`${prefix}Index`).value = index;
    document.getElementById(`${prefix}Name`).value = client.name || '';
    document.getElementById(`${prefix}Os`).value = client.os || '';
    document.getElementById(`${prefix}Url`).value = client.url || '';
    document.getElementById(`${prefix}Manual`).value = client.manual || '';
    document.getElementById(`${prefix}QrPath`).value = client.qrCode || '';
    
    // Set QR preview
    const qrPreview = document.getElementById(`${prefix}QrPreview`);
    if (client.qrCode) {
        qrPreview.src = client.qrCode;
        qrPreview.classList.remove('hidden');
    } else {
        qrPreview.classList.add('hidden');
        qrPreview.src = '';
    }
    
    // Set icon
    const icon = client.icon || 'fa-globe';
    const iconRadio = document.querySelector(`input[name="${prefix}Icon"][value="${icon}"]`);
    if (iconRadio) iconRadio.checked = true;
    
    document.getElementById(titleId).textContent = '编辑客户端';
    document.querySelector(`#${formId} button[type="submit"]`).textContent = '更新';
    document.getElementById(containerId).classList.remove('hidden');
    
    // Scroll to form
    document.getElementById(containerId).scrollIntoView({ behavior: 'smooth' });
}

// 处理移动客户端排序 (Local Only -> Auto Save)
async function handleMoveClient(e) {
    const btn = e.currentTarget;
    const index = parseInt(btn.dataset.index);
    const direction = parseInt(btn.dataset.direction); // -1 up, 1 down
    const type = btn.dataset.type;
    
    const listKey = type === 'custom' ? 'customClients' : 'openConnectClients';
    const listContainerId = type === 'custom' ? 'customClientsContainer' : 'otherClientsContainer';
    const listType = type === 'custom' ? 'custom' : 'openConnect';

    if (!appData || !appData[listKey]) return;
    
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= appData[listKey].length) return;
    
    // Swap
    const temp = appData[listKey][index];
    appData[listKey][index] = appData[listKey][newIndex];
    appData[listKey][newIndex] = temp;
    
    // Save immediately
    await saveClientList(listType, appData[listKey]);

    // Update UI
    populateClientList(appData[listKey], listContainerId, listType);
}

// 处理删除客户端 (Local Only)
function handleDeleteClient(e) {
    const btn = e.currentTarget;
    const index = parseInt(btn.dataset.index);
    const type = btn.dataset.type;
    
    // Fix key mapping to ensure we target the correct array
    const listKey = type === 'custom' ? 'customClients' : 'openConnectClients';
    const listContainerId = type === 'custom' ? 'customClientsContainer' : 'otherClientsContainer';
    const listType = type === 'custom' ? 'custom' : 'openConnect';

    if (!appData || !appData[listKey]) return;

    // Check if confirmation group already exists
    const parent = btn.parentElement;
    if (parent.querySelector('.confirm-group')) return;

    // Hide delete button
    btn.classList.add('hidden');

    // Create confirmation group
    const confirmGroup = document.createElement('div');
    confirmGroup.className = 'confirm-group flex items-center gap-2 animate-fade-in';
    confirmGroup.innerHTML = `
        <button type="button" class="cancel-btn bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-300 transition-colors">
            取消
        </button>
        <button type="button" class="confirm-btn bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 transition-colors">
            确认
        </button>
    `;

    // Append to parent
    parent.appendChild(confirmGroup);

    // Bind events
    const confirmBtn = confirmGroup.querySelector('.confirm-btn');
    const cancelBtn = confirmGroup.querySelector('.cancel-btn');

    cancelBtn.addEventListener('click', (ev) => {
        ev.stopPropagation(); // Prevent bubbling if needed
        confirmGroup.remove();
        btn.classList.remove('hidden');
    });

    confirmBtn.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        // Perform delete
        if (index >= 0 && index < appData[listKey].length) {
            appData[listKey].splice(index, 1);
            
            // Auto save
            const success = await saveClientList(listType, appData[listKey]);
            
            if (success) {
                // Update UI
                populateClientList(appData[listKey], listContainerId, listType);
                
                // Show notification (reusing global notification style)
                const notification = document.createElement('div');
                notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
                notification.textContent = '客户端已删除并保存';
                document.body.appendChild(notification);
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            } else {
                alert('保存失败，请重试');
                btn.classList.remove('hidden'); // Show delete button again if failed
                confirmGroup.remove();
            }
        }
    });
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
            const typeName = type === 'ios' ? 'iOS' : (type === 'android' ? 'Android' : (type === 'harmony' ? 'HarmonyOS' : '咨询'));
            showMessage(message, `${typeName} 二维码更新成功`, 'success');
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

    // 显示加载状态（可选）
    const saveBtn = document.getElementById('saveAllBtnTop');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '保存中...';
    saveBtn.disabled = true;

    try {
        // 依次调用各更新方法（等待每一个完成）
        await handleHeaderNavUpdate(new Event('submit'));
        await handleBannerUpdate(new Event('submit'));
        await handleTextsUpdate(new Event('submit'));
        await handleDownloadsUpdate(new Event('submit'));
        await handleManualsUpdate(new Event('submit'));
        
        // Save Client Lists
        await saveClientList('openConnect', appData.openConnectClients);
        await saveClientList('custom', appData.customClients);

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
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存过程中出现错误，请检查网络或重试');
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// Helper to save client lists
async function saveClientList(type, clients) {
    if (!clients) return false;
    try {
        const response = await fetch('/api/save-clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clients, type })
        });
        const result = await response.json();
        if (result.success) {
            notifyFrontendUpdate();
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error saving ${type} clients:`, error);
        return false;
    }
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
    // 同时更新本地的 ciscoDataUpdated 触发主页面的监听
    localStorage.setItem('ciscoDataUpdated', Date.now().toString());
}
