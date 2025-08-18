// 全局数据存储
let appData = null;

// 可读的平台显示名称
function prettyPlatformName(platform) {
    if (!platform) return '';
    const p = String(platform).toLowerCase().trim();
    if (p === 'ios') return 'iOS';
    if (p === 'macos' || p === 'mac os' || p === 'mac') return 'macOS';
    if (p === 'windows' || p === 'win') return 'Windows';
    if (p === 'linux') return 'Linux';
    if (p === 'android') return 'Android';
    // fallback: capitalize first letter, keep rest as-is
    return platform.charAt(0).toUpperCase() + platform.slice(1);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化粒子背景
    initParticles();

    // 加载数据
    loadData();

    // 设置定时刷新数据
    setInterval(loadData, 30000); // 每30秒刷新一次

    // 监听localStorage变化，实现跨页面实时更新
    window.addEventListener('storage', (e) => {
        if (e.key === 'ciscoDataUpdated') {
            loadData();
        }
    });

    // 绑定下载按钮事件
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.getAttribute('data-platform');
            openDownloadModal(platform);
        });
    });

    // 绑定二维码按钮事件
    document.querySelectorAll('.qr-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.getAttribute('data-platform');
            openQrModal(platform);
        });
    });

    // 绑定关闭弹窗事件
    document.getElementById('closeDownloadModal').addEventListener('click', () => {
        document.getElementById('downloadModal').classList.add('hidden');
    });

    document.getElementById('closeQrModal').addEventListener('click', () => {
        document.getElementById('qrModal').classList.add('hidden');
    });
});

// 初始化粒子背景
function initParticles() {
    particlesJS('particles-js', {
        "particles": {
            "number": {
                "value": 80,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": "#0070c9"
            },
            "shape": {
                "type": "circle"
            },
            "opacity": {
                "value": 0.5,
                "random": true
            },
            "size": {
                "value": 3,
                "random": true
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": "#0070c9",
                "opacity": 0.2,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 1,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "grab"
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 140,
                    "line_linked": {
                        "opacity": 0.5
                    }
                },
                "push": {
                    "particles_nb": 4
                }
            }
        },
        "retina_detect": true
    });
}

// 从服务器加载数据
async function loadData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        appData = data;
        updateUI(data);
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 更新UI显示
function updateUI(data) {
    // 更新标题和文本
    document.getElementById('headerTitle').textContent = data.texts?.title || 'Cisco Secure Client';
    document.getElementById('mainTitle').textContent = data.texts?.title || 'Cisco Secure Client';
    document.getElementById('mainSubtitle').textContent = data.texts?.subtitle || '安全连接，无处不在。下载适用于您设备的Cisco Secure Client客户端，轻松建立安全连接。';
    document.getElementById('downloadSectionTitle').textContent = data.texts?.downloadSectionTitle || '选择您的平台下载';

    // 更新其他客户端（只有存在客户端时才显示）
    const otherClientsSection = document.getElementById('otherClientsSection');
    const otherClientsContainer = document.getElementById('otherClientsContainer');

    if (data.otherClients && data.otherClients.length > 0) {
        otherClientsSection.classList.remove('hidden');
        otherClientsContainer.innerHTML = '';

        data.otherClients.forEach(client => {
            const clientCard = document.createElement('div');
            clientCard.className = 'bg-white rounded-xl shadow p-6 card-hover';
            clientCard.innerHTML = `
                <h4 class="text-lg font-semibold mb-2">${client.name}</h4>
                <p class="text-sm text-neutral-600 mb-2">适配系统: ${client.os}</p>
                <div class="flex flex-wrap gap-3 mt-4">
                    <a href="${client.url}" target="_blank" class="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm hover:bg-primary/20 transition-colors">
                        <i class="fa fa-download mr-2"></i> 下载
                    </a>
                    <a href="${client.manual}" target="_blank" class="inline-flex items-center bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg text-sm hover:bg-neutral-200 transition-colors">
                        <i class="fa fa-book mr-2"></i> 手册
                    </a>
                </div>
            `;
            otherClientsContainer.appendChild(clientCard);
        });
    } else {
        otherClientsSection.classList.add('hidden');
    }
}

// 打开下载弹窗
function openDownloadModal(platform) {
    if (!appData) return;

    const modal = document.getElementById('downloadModal');
    const modalTitle = document.getElementById('modalTitle');
    const versionOptions = document.getElementById('versionOptions');
    const manualLink = document.getElementById('manualLink');
    const manualText = document.getElementById('manualText');

    // 设置弹窗标题（使用 prettyPlatformName 确保 iOS/macOS 等正确显示）
    modalTitle.textContent = `${prettyPlatformName(platform)} 下载`;

    // 清空之前的选项
    versionOptions.innerHTML = '';

    // 根据平台设置版本选项
    const downloads = appData.downloads || {};
    const platformData = downloads[platform];

    if (platform === 'windows' && platformData) {
        // Windows版本选项
        if (platformData.amd) {
            addVersionOption(versionOptions, 'Windows (AMD64)', platformData.amd);
        }
        if (platformData.arm) {
            addVersionOption(versionOptions, 'Windows (ARM64)', platformData.arm);
        }
        // 设置手册
        manualLink.href = appData.manuals?.windows || '#';
        manualText.textContent = appData.texts?.manualWindows || 'Windows 使用手册';
    }
    else if (platform === 'macos' && platformData) {
        // macOS版本选项
        if (platformData.intel) {
            addVersionOption(versionOptions, 'macOS (Intel)', platformData.intel);
        }
        if (platformData.arm) {
            addVersionOption(versionOptions, 'macOS (Apple Silicon)', platformData.arm);
        }
        if (platformData.appStore) {
            addVersionOption(versionOptions, 'macOS (App Store)', platformData.appStore);
        }
        // 设置手册
        manualLink.href = appData.manuals?.macos || '#';
        manualText.textContent = appData.texts?.manualMacOS || 'macOS 使用手册';
    }
    else if (platform === 'linux' && platformData) {
        // Linux版本选项
        if (platformData.deb) {
            addVersionOption(versionOptions, 'Linux (Debian/Ubuntu)', platformData.deb);
        }
        if (platformData.rpm) {
            addVersionOption(versionOptions, 'Linux (RedHat/CentOS)', platformData.rpm);
        }
        // 设置手册
        manualLink.href = appData.manuals?.linux || '#';
        manualText.textContent = appData.texts?.manualLinux || 'Linux 使用手册';
    }
    else if (platform === 'ios' && platformData) {
        // iOS版本选项
        addVersionOption(versionOptions, 'iOS App Store', platformData);
        // 设置手册
        manualLink.href = appData.manuals?.ios || '#';
        manualText.textContent = appData.texts?.manualIOS || 'iOS 使用手册';
    }
    else if (platform === 'android' && platformData) {
        // Android版本选项
        if (platformData.latest) {
            addVersionOption(versionOptions, 'Android (最新版本)', platformData.latest);
        }
        if (platformData.old) {
            addVersionOption(versionOptions, 'Android (旧版本)', platformData.old);
        }
        // 设置手册
        manualLink.href = appData.manuals?.android || '#';
        manualText.textContent = appData.texts?.manualAndroid || 'Android 使用手册';
    }

    // 显示弹窗
    modal.classList.remove('hidden');
}

// 添加版本选项到弹窗
function addVersionOption(container, label, url) {
    const option = document.createElement('div');
    option.className = 'p-4 border border-neutral-200 rounded-lg';
    option.innerHTML = `
        <h5 class="font-medium mb-2">${label}</h5>
        <a href="${url}" target="_blank" class="inline-flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm btn-hover">
            <i class="fa fa-download mr-2"></i> 下载
        </a>
    `;
    container.appendChild(option);
}

// 打开二维码弹窗
function openQrModal(platform) {
    if (!appData) return;

    const modal = document.getElementById('qrModal');
    const qrModalTitle = document.getElementById('qrModalTitle');
    const qrImage = document.getElementById('qrImage');

    // 设置弹窗标题（使用 prettyPlatformName）
    qrModalTitle.textContent = `${prettyPlatformName(platform)} 扫码下载`;

    // 设置二维码图片
    const qrCodePath = appData.qrcodes?.[platform] || `img/${platform}-qr.png`;
    qrImage.src = qrCodePath;
    qrImage.alt = `${prettyPlatformName(platform)} 下载二维码`;

    // 显示弹窗
    modal.classList.remove('hidden');
}

