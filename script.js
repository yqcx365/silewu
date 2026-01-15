// script.js
// 数据存储
let userData = {
    id: 'DLP-2024-' + Math.floor(1000 + Math.random() * 9000),
    name: '数字公民 #' + Math.floor(1000 + Math.random() * 9000),
    lifeForce: 100,
    streakDays: 0,
    totalDays: 0,
    lastCheckin: null,
    checkinHistory: [],
    email: '',
    reminderTime: '20',
    notifications: [],
    achievements: [],
    energyCores: 3,
    joinDate: new Date().toISOString(),
    settings: {
        dailyReminder: true,
        lowEnergyWarning: true,
        deathWarning: true
    }
};

// 系统数据
const systemData = {
    activeUsers: 1247,
    todayDeaths: 8,
    longestStreak: 1095,
    systemUptime: 365
};

// 通知权限状态
let notificationEnabled = false;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载用户数据
    loadUserData();
    
    // 初始化UI
    initUI();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 开始倒计时
    startCountdown();
    
    // 生成日历
    generateCalendar();
    
    // 生成通知
    generateNotifications();
    
    // 生成成就
    generateAchievements();
    
    // 模拟背景特效
    initMatrixBackground();
    
    // 请求通知权限
    requestNotificationPermission();
    
    // 设置每日提醒
    scheduleDailyReminder();
    
    // 注册 Service Worker
    registerServiceWorker();
    
    // 添加快捷键支持
    setupKeyboardShortcuts();
    
    // 隐藏加载动画
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
    }, 1500);
});

// 验证用户数据完整性
function isValidUserData(data) {
    const requiredFields = ['id', 'name', 'lifeForce', 'streakDays', 'totalDays', 'checkinHistory', 'energyCores', 'joinDate', 'settings'];
    return requiredFields.every(field => data.hasOwnProperty(field)) && 
           typeof data.lifeForce === 'number' &&
           data.lifeForce >= 0 && data.lifeForce <= 100;
}

// 加载用户数据
function loadUserData() {
    try {
        const savedData = localStorage.getItem('digitalImmortalityData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            // 验证数据结构
            if (isValidUserData(parsed)) {
                userData = parsed;
                // 检查是否需要减少生命能量
                checkLifeForceDecay();
            } else {
                console.warn('数据结构不完整，使用默认数据');
                showMessage('数据已重置为默认值', 'warning');
            }
        }
    } catch (error) {
        console.error('数据加载失败:', error);
        showMessage('数据加载失败，已重置', 'error');
        // 清除损坏的数据
        localStorage.removeItem('digitalImmortalityData');
    }
}

// 保存用户数据
function saveUserData() {
    localStorage.setItem('digitalImmortalityData', JSON.stringify(userData));
}

// 初始化UI
function initUI() {
    // 用户信息
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userId').textContent = `ID: ${userData.id}`;
    document.getElementById('lifeForce').textContent = `${Math.round(userData.lifeForce)}%`;
    document.getElementById('streakDays').textContent = userData.streakDays;
    document.getElementById('totalDays').textContent = userData.totalDays;
    document.getElementById('energyCores').textContent = userData.energyCores;
    
    // 更新能量条
    updateEnergyBar();
    
    // 更新全局统计
    document.getElementById('activeUsers').textContent = systemData.activeUsers.toLocaleString();
    document.getElementById('todayDeaths').textContent = systemData.todayDeaths;
    document.getElementById('longestStreak').textContent = systemData.longestStreak;
    document.getElementById('systemUptime').textContent = systemData.systemUptime;
    
    // 设置邮箱表单
    document.getElementById('emailInput').value = userData.email;
    document.getElementById('reminderTime').value = userData.reminderTime;
    document.getElementById('dailyReminder').checked = userData.settings.dailyReminder;
    document.getElementById('lowEnergyWarning').checked = userData.settings.lowEnergyWarning;
    document.getElementById('deathWarning').checked = userData.settings.deathWarning;
    
    // 更新状态
    updateStatus();
}

// 检查生命能量衰减
function checkLifeForceDecay() {
    if (!userData.lastCheckin) return;
    
    const lastCheckin = new Date(userData.lastCheckin);
    const now = new Date();
    const hoursSinceCheckin = Math.floor((now - lastCheckin) / (1000 * 60 * 60));
    
    // 每24小时减少15%生命能量（从15%开始计算，24小时后开始衰减）
    const daysSinceCheckin = Math.floor(hoursSinceCheckin / 24);
    
    if (daysSinceCheckin > 0) {
        // 第一天不衰减，从第二天开始每天15%
        const decay = daysSinceCheckin * 15;
        const newLifeForce = Math.max(0, 100 - decay);
        
        // 只有当新的生命值低于当前值时才更新（避免重复衰减）
        if (newLifeForce < userData.lifeForce) {
            userData.lifeForce = newLifeForce;
        }
        
        // 如果超过2天未签到，清空连续天数
        if (daysSinceCheckin >= 2) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            
            const lastCheckinDay = new Date(lastCheckin);
            lastCheckinDay.setHours(0, 0, 0, 0);
            
            // 检查昨天是否签到
            if (lastCheckinDay < yesterday) {
                userData.streakDays = 0;
            }
        }
        
        saveUserData();
        updateUI();
        
        // 检查是否需要发送警告
        if (userData.lifeForce < 30 && userData.lifeForce > 0 && userData.settings.lowEnergyWarning && userData.email) {
            sendLowEnergyWarning();
        }
        
        // 检查是否死亡
        if (userData.lifeForce <= 0 && userData.settings.deathWarning) {
            showDeathModal();
        }
    }
}

// 更新UI
function updateUI() {
    document.getElementById('lifeForce').textContent = `${Math.round(userData.lifeForce)}%`;
    document.getElementById('streakDays').textContent = userData.streakDays;
    document.getElementById('totalDays').textContent = userData.totalDays;
    document.getElementById('energyCores').textContent = userData.energyCores;
    
    updateEnergyBar();
    updateStatus();
    updateCountdown();
    generateCalendar();
    
    // 更新头像状态
    const avatarStatus = document.getElementById('avatarStatus');
    if (userData.lifeForce > 70) {
        avatarStatus.style.background = '#00ff88';
    } else if (userData.lifeForce > 30) {
        avatarStatus.style.background = '#ffa502';
    } else {
        avatarStatus.style.background = '#ff4757';
        avatarStatus.style.animation = 'blink 1s infinite';
    }
}

// 更新能量条
function updateEnergyBar() {
    const energyFill = document.getElementById('energyFill');
    const dangerLevel = document.getElementById('dangerLevel');
    const levelSpan = dangerLevel.querySelector('span');
    
    energyFill.style.width = `${userData.lifeForce}%`;
    
    if (userData.lifeForce > 70) {
        levelSpan.textContent = '绿色';
        levelSpan.className = 'safe';
    } else if (userData.lifeForce > 30) {
        levelSpan.textContent = '黄色';
        levelSpan.className = 'warning';
    } else {
        levelSpan.textContent = '红色';
        levelSpan.className = 'danger';
    }
}

// 更新状态
function updateStatus() {
    const checkinBtn = document.getElementById('checkinBtn');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (userData.lastCheckin) {
        const lastCheckinDate = new Date(userData.lastCheckin);
        const lastCheckinDay = new Date(lastCheckinDate.getFullYear(), lastCheckinDate.getMonth(), lastCheckinDate.getDate());
        
        if (lastCheckinDay.getTime() === today.getTime()) {
            checkinBtn.innerHTML = '<i class="fas fa-check-circle"></i><span>今日已签到</span>';
            checkinBtn.disabled = true;
        } else {
            checkinBtn.innerHTML = '<i class="fas fa-fingerprint"></i><span>今日签到</span>';
            checkinBtn.disabled = false;
        }
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 签到按钮
    document.getElementById('checkinBtn').addEventListener('click', performCheckin);
    
    // 保存邮箱设置
    document.getElementById('saveEmailBtn').addEventListener('click', saveEmailSettings);
    
    // 紧急求救按钮
    document.getElementById('emergencyBtn').addEventListener('click', sendEmergencyEmail);
    
    // 随机生成用户名
    document.getElementById('userName').addEventListener('click', function() {
        const names = ['数字先驱', '永恒旅者', '量子意识', '矩阵行者', '代码生命体', '网络幽灵'];
        userData.name = names[Math.floor(Math.random() * names.length)] + ' #' + Math.floor(1000 + Math.random() * 9000);
        this.textContent = userData.name;
        saveUserData();
    });
    
    // 查看历史
    document.getElementById('viewHistoryBtn').addEventListener('click', function() {
        alert(`总共签到 ${userData.totalDays} 天\n最长连续 ${Math.max(...userData.checkinHistory.map(h => h.streak))} 天\n当前连续 ${userData.streakDays} 天`);
    });
    
    // 复活按钮
    document.getElementById('reviveBtn').addEventListener('click', function() {
        if (userData.energyCores > 0) {
            userData.energyCores--;
            userData.lifeForce = 100;
            userData.streakDays = 0;
            saveUserData();
            updateUI();
            
            document.getElementById('deathModal').classList.remove('active');
            showMessage('已使用能量核心复活！', 'success');
            
            // 添加通知
            addNotification('成功复活', '消耗1个能量核心，生命值已恢复至100%', 'success');
        } else {
            showMessage('能量核心不足！', 'error');
        }
    });
    
    // 接受死亡按钮
    document.getElementById('acceptDeathBtn').addEventListener('click', function() {
        if (confirm('确定要接受数字死亡吗？所有数据将被永久删除！')) {
            localStorage.removeItem('digitalImmortalityData');
            location.reload();
        }
    });
    
    // 关闭签到模态框
    document.getElementById('closeCheckinModal').addEventListener('click', function() {
        document.getElementById('checkinModal').classList.remove('active');
    });
    
    // 服务条款和隐私政策
    document.getElementById('termsLink').addEventListener('click', function(e) {
        e.preventDefault();
        showTermsModal();
    });
    
    document.getElementById('privacyLink').addEventListener('click', function(e) {
        e.preventDefault();
        showPrivacyModal();
    });
    
    // 导出数据
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    
    // 重置数据
    document.getElementById('resetDataBtn').addEventListener('click', resetData);
    
    // 添加导入数据按钮（隐藏的input）
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = 'application/json';
    importInput.style.display = 'none';
    importInput.id = 'importInput';
    document.body.appendChild(importInput);
    
    importInput.addEventListener('change', importData);
}

// 执行签到
function performCheckin() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 检查是否已经签到
    if (userData.lastCheckin) {
        const lastCheckin = new Date(userData.lastCheckin);
        const lastCheckinDay = new Date(lastCheckin.getFullYear(), lastCheckin.getMonth(), lastCheckin.getDate());
        
        if (lastCheckinDay.getTime() === today.getTime()) {
            showMessage('今天已经签到过了！', 'info');
            return;
        }
        
        // 检查是否连续签到
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastCheckinDay.getTime() === yesterday.getTime()) {
            userData.streakDays++;
        } else {
            userData.streakDays = 1;
        }
    } else {
        userData.streakDays = 1;
    }
    
    // 更新数据
    userData.lastCheckin = now.toISOString();
    userData.totalDays++;
    userData.lifeForce = Math.min(100, userData.lifeForce + 15); // 每次签到恢复15%
    
    // 记录签到历史
    userData.checkinHistory.push({
        date: now.toISOString(),
        streak: userData.streakDays,
        lifeForce: userData.lifeForce
    });
    
    // 保留最近90天记录，防止LocalStorage溢出
    if (userData.checkinHistory.length > 90) {
        userData.checkinHistory = userData.checkinHistory.slice(-90);
    }
    
    // 保存数据
    saveUserData();
    
    // 更新UI
    updateUI();
    
    // 播放成功音效
    playSound('success');
    
    // 显示签到奖励
    showCheckinReward();
    
    // 添加通知
    addNotification('签到成功', `连续签到 ${userData.streakDays} 天，生命能量恢复至 ${Math.round(userData.lifeForce)}%`, 'checkin');
    
    // 发送浏览器通知
    showNotification('✅ 签到成功', `连续 ${userData.streakDays} 天，生命能量 ${Math.round(userData.lifeForce)}%`, 'success');
    
    // 检查成就
    checkAchievements();
}

// 显示签到奖励
function showCheckinReward() {
    const modal = document.getElementById('checkinModal');
    const rewardDiv = document.getElementById('checkinReward');
    
    // 计算额外奖励
    let bonus = '';
    if (userData.streakDays % 7 === 0) {
        bonus = '<div class="reward-item"><i class="fas fa-gem"></i><div><h4>能量核心 x1</h4><p>连续7天签到奖励</p></div></div>';
        userData.energyCores++;
        saveUserData(); // 保存能量核心
    }
    
    if (userData.streakDays % 30 === 0) {
        bonus += '<div class="reward-item"><i class="fas fa-crown"></i><div><h4>永恒徽章</h4><p>连续30天签到成就</p></div></div>';
    }
    
    rewardDiv.innerHTML = `
        <div class="reward-item">
            <i class="fas fa-heartbeat"></i>
            <div>
                <h4>生命能量 +15%</h4>
                <p>当前: ${Math.round(userData.lifeForce)}%</p>
            </div>
        </div>
        <div class="reward-item">
            <i class="fas fa-calendar-check"></i>
            <div>
                <h4>连续签到 ${userData.streakDays} 天</h4>
                <p>总签到天数: ${userData.totalDays}</p>
            </div>
        </div>
        ${bonus}
        <div class="reward-item">
            <i class="fas fa-battery-three-quarters"></i>
            <div>
                <h4>能量核心: ${userData.energyCores}</h4>
                <p>可用于复活</p>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// 开始倒计时
function startCountdown() {
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// 更新倒计时
function updateCountdown() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeLeft = tomorrow - now;
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = days.toString().padStart(2, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    
    // 更新下次签到时间
    const nextCheckinTime = document.querySelector('#nextCheckinTime span');
    nextCheckinTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 更新死亡倒计时（如果生命能量低）
    if (userData.lifeForce <= 0) {
        const deathCountdown = document.getElementById('deathCountdown');
        // 计算距离永久删除的时间（基于生命能量为0的天数）
        const deathTime = new Date(userData.lastCheckin);
        deathTime.setDate(deathTime.getDate() + 7);
        const timeUntilDeath = deathTime - now;
        
        if (timeUntilDeath > 0) {
            const deathMinutes = Math.floor((timeUntilDeath % (1000 * 60 * 60)) / (1000 * 60));
            const deathSeconds = Math.floor((timeUntilDeath % (1000 * 60)) / 1000);
            deathCountdown.textContent = `${deathMinutes.toString().padStart(2, '0')}:${deathSeconds.toString().padStart(2, '0')}`;
        }
    }
}

// 生成日历
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    // 获取当月第一天是星期几
    const firstDay = new Date(year, month, 1).getDay();
    
    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let calendarHTML = '';
    
    // 添加星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
        calendarHTML += `<div class="calendar-header">${day}</div>`;
    });
    
    // 添加上个月的日期（灰色显示）
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        calendarHTML += `<div class="calendar-day future">${prevMonthDays - i}</div>`;
    }
    
    // 添加当月日期
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        
        let className = 'calendar-day';
        
        // 检查今天
        if (day === today) {
            className += ' today';
        }
        
        // 检查是否签到
        if (userData.checkinHistory.some(checkin => {
            const checkinDate = new Date(checkin.date).toISOString().split('T')[0];
            return checkinDate === dateString;
        })) {
            className += ' checked';
        }
        
        // 检查是否错过签到（今天之前的日期且未签到）
        else if (day < today) {
            className += ' missed';
        }
        
        // 未来日期
        else if (day > today) {
            className += ' future';
        }
        
        calendarHTML += `<div class="${className}">${day}</div>`;
    }
    
    // 计算需要添加的下个月日期
    const totalCells = 49; // 7行 * 7天 (包括星期标题)
    const cellsUsed = 7 + firstDay + daysInMonth; // 星期标题 + 上月补充天数 + 本月天数
    const nextMonthDaysNeeded = totalCells - cellsUsed;
    
    // 添加下个月的日期
    for (let i = 1; i <= nextMonthDaysNeeded; i++) {
        calendarHTML += `<div class="calendar-day future">${i}</div>`;
    }
    
    calendar.innerHTML = calendarHTML;
}

// 生成通知
function generateNotifications() {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
    
    // 添加系统通知
    const notifications = [
        {
            title: '欢迎加入数字永生计划',
            message: '你的数字生命已经开始，请每日签到维持生命能量',
            time: '刚刚',
            unread: true
        },
        {
            title: '系统更新',
            message: '新增成就系统和能量核心功能',
            time: '2小时前',
            unread: true
        },
        {
            title: '活动提醒',
            message: '连续签到7天可获得能量核心奖励',
            time: '1天前',
            unread: false
        }
    ];
    
    // 添加用户通知
    if (userData.lifeForce < 50) {
        notifications.unshift({
            title: '生命能量不足',
            message: `当前生命能量仅剩 ${Math.round(userData.lifeForce)}%，请及时签到`,
            time: '刚刚',
            unread: true
        });
    }
    
    if (userData.streakDays >= 3) {
        notifications.unshift({
            title: '连续签到成就',
            message: `已连续签到 ${userData.streakDays} 天，继续加油！`,
            time: '刚刚',
            unread: true
        });
    }
    
    let notificationHTML = '';
    notifications.forEach(notification => {
        notificationHTML += `
            <div class="notification-item ${notification.unread ? 'unread' : ''}">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <div class="notification-time">${notification.time}</div>
            </div>
        `;
    });
    
    notificationList.innerHTML = notificationHTML;
    notificationCount.textContent = notifications.filter(n => n.unread).length;
    
    // 保存通知
    userData.notifications = notifications;
}

// 添加新通知
function addNotification(title, message, type = 'info') {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
    
    const time = '刚刚';
    
    const notificationHTML = `
        <div class="notification-item unread">
            <h4>${title}</h4>
            <p>${message}</p>
            <div class="notification-time">${time}</div>
        </div>
    `;
    
    notificationList.insertAdjacentHTML('afterbegin', notificationHTML);
    
    // 更新计数
    const currentCount = parseInt(notificationCount.textContent);
    notificationCount.textContent = currentCount + 1;
    
    // 添加到用户数据
    userData.notifications.unshift({
        title,
        message,
        time,
        unread: true,
        type
    });
}

// 生成成就
function generateAchievements() {
    const achievementList = document.getElementById('achievementList');
    
    const achievements = [
        {
            id: 'first_checkin',
            title: '首次签到',
            description: '完成第一次签到',
            icon: 'fas fa-star',
            unlocked: userData.totalDays > 0
        },
        {
            id: 'streak_7',
            title: '坚持不懈',
            description: '连续签到7天',
            icon: 'fas fa-fire',
            unlocked: userData.streakDays >= 7
        },
        {
            id: 'streak_30',
            title: '永恒追求',
            description: '连续签到30天',
            icon: 'fas fa-crown',
            unlocked: userData.streakDays >= 30
        },
        {
            id: 'total_100',
            title: '百炼成钢',
            description: '总签到100天',
            icon: 'fas fa-trophy',
            unlocked: userData.totalDays >= 100
        },
        {
            id: 'full_energy',
            title: '生命满溢',
            description: '生命能量达到100%',
            icon: 'fas fa-battery-full',
            unlocked: userData.lifeForce >= 100
        },
        {
            id: 'email_set',
            title: '生命连线',
            description: '设置生命维持邮箱',
            icon: 'fas fa-envelope',
            unlocked: !!userData.email
        },
        {
            id: 'emergency_used',
            title: '紧急呼救',
            description: '使用紧急求救功能',
            icon: 'fas fa-sos',
            unlocked: false
        },
        {
            id: 'revived',
            title: '死而复生',
            description: '从数字死亡中复活',
            icon: 'fas fa-heart-circle-plus',
            unlocked: false
        }
    ];
    
    let achievementHTML = '';
    achievements.forEach(achievement => {
        achievementHTML += `
            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <i class="${achievement.icon}"></i>
                <div class="achievement-info">
                    <h4>${achievement.title}</h4>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;
    });
    
    achievementList.innerHTML = achievementHTML;
    
    // 保存到用户数据
    userData.achievements = achievements;
}

// 检查成就
function checkAchievements() {
    // 更新成就状态
    userData.achievements.forEach(achievement => {
        switch(achievement.id) {
            case 'first_checkin':
                achievement.unlocked = userData.totalDays > 0;
                break;
            case 'streak_7':
                achievement.unlocked = userData.streakDays >= 7;
                break;
            case 'streak_30':
                achievement.unlocked = userData.streakDays >= 30;
                break;
            case 'total_100':
                achievement.unlocked = userData.totalDays >= 100;
                break;
            case 'full_energy':
                achievement.unlocked = userData.lifeForce >= 100;
                break;
            case 'email_set':
                achievement.unlocked = !!userData.email;
                break;
        }
    });
    
    // 重新生成成就显示
    generateAchievements();
}

// 保存邮箱设置
function saveEmailSettings() {
    const email = document.getElementById('emailInput').value;
    const reminderTime = document.getElementById('reminderTime').value;
    
    if (email && !validateEmail(email)) {
        showMessage('请输入有效的邮箱地址', 'error');
        return;
    }
    
    userData.email = email;
    userData.reminderTime = reminderTime;
    userData.settings.dailyReminder = document.getElementById('dailyReminder').checked;
    userData.settings.lowEnergyWarning = document.getElementById('lowEnergyWarning').checked;
    userData.settings.deathWarning = document.getElementById('deathWarning').checked;
    
    saveUserData();
    showMessage('设置已保存', 'success');
    
    // 添加通知
    if (email) {
        addNotification('邮箱设置成功', '生命维持邮箱已激活，重要通知将发送至您的邮箱', 'email');
    }
}

// 发送低能量警告
function sendLowEnergyWarning() {
    if (!userData.email || !userData.settings.lowEnergyWarning) return;
    
    const subject = '⚠️ 数字永生计划 - 生命能量不足警告';
    const body = `
尊敬的 ${userData.name}，

您的数字生命能量仅剩 ${Math.round(userData.lifeForce)}%，已进入危险状态！

请立即访问数字永生计划进行签到，以维持您的数字生命。
连续7天未签到将导致数字死亡，所有数据将被永久删除。

签到链接: ${window.location.href}

紧急提醒时间: ${new Date().toLocaleString('zh-CN')}

----------------------------------------
数字永生实验室
本邮件由系统自动发送，请勿回复
    `;
    
    // 模拟发送邮件
    console.log('发送低能量警告邮件到:', userData.email);
    console.log('主题:', subject);
    console.log('内容:', body);
    
    showMessage('低能量警告邮件已发送', 'info');
}

// 发送紧急求救邮件
function sendEmergencyEmail() {
    if (userData.lifeForce > 20) {
        showMessage('生命能量高于20%，无法使用紧急求救', 'warning');
        return;
    }
    
    if (!userData.email) {
        showMessage('请先设置邮箱地址', 'error');
        return;
    }
    
    const subject = '🚨 紧急求救 - 数字生命即将终止';
    const body = `
紧急求救通知

数字公民: ${userData.name}
数字ID: ${userData.id}
当前生命能量: ${Math.round(userData.lifeForce)}%
连续签到天数: ${userData.streakDays} 天
最后签到时间: ${new Date(userData.lastCheckin).toLocaleString('zh-CN')}

⚠️ 警告：数字生命即将终止！
生命能量已低于20%，急需立即签到维持生命。

请立即访问以下链接进行签到抢救：
${window.location.href}

----------------------------------------
数字永生实验室 - 紧急响应系统
本邮件为紧急求救通知，请勿忽略
    `;
    
    // 模拟发送邮件
    console.log('发送紧急求救邮件到:', userData.email);
    console.log('主题:', subject);
    console.log('内容:', body);
    
    // 更新成就
    userData.achievements.find(a => a.id === 'emergency_used').unlocked = true;
    
    showMessage('紧急求救邮件已发送！请检查您的邮箱', 'success');
    addNotification('紧急求救已发送', '求救邮件已发送至您的邮箱，请立即签到', 'emergency');
}

// 显示死亡模态框
function showDeathModal() {
    const modal = document.getElementById('deathModal');
    modal.classList.add('active');
    
    // 更新死亡消息
    const deathMessage = document.getElementById('deathMessage');
    deathMessage.innerHTML = `
        <p>你的数字生命能量已耗尽！</p>
        <p class="countdown-death">永久删除倒计时: <span id="deathCountdown">05:00</span></p>
        <p>剩余能量核心: ${userData.energyCores} 个</p>
    `;
}

// 显示消息
function showMessage(text, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    
    // 播放音效
    if (type === 'success') {
        playSound('success');
    } else if (type === 'error') {
        playSound('error');
    } else if (type === 'warning') {
        playSound('warning');
    }
    
    // 设置颜色
    if (type === 'success') {
        messageDiv.style.background = 'linear-gradient(135deg, #00b894, #00ff88)';
    } else if (type === 'error') {
        messageDiv.style.background = 'linear-gradient(135deg, #ff4757, #ff6b81)';
    } else if (type === 'warning') {
        messageDiv.style.background = 'linear-gradient(135deg, #f39c12, #ffa502)';
    } else {
        messageDiv.style.background = 'linear-gradient(135deg, #0984e3, #00ccff)';
    }
    
    // 显示消息
    messageDiv.classList.add('show');
    
    // 3秒后隐藏
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 3000);
}

// 显示服务条款
function showTermsModal() {
    alert(`数字永生计划服务条款

1. 数字生命定义
   用户通过每日签到维持的数字存在状态

2. 用户责任
   - 每日签到以维持生命能量
   - 设置有效邮箱接收通知
   - 及时响应紧急警告

3. 死亡条款
   - 连续7天未签到将导致数字死亡
   - 数字死亡后所有数据将被永久删除
   - 可使用能量核心复活

4. 免责声明
   本服务仅供娱乐，不承担任何数据损失责任
   
5. 数据使用
   用户数据仅用于本系统功能，不会共享给第三方

同意条款即表示您理解并接受上述内容。`);
}

// 显示隐私政策
function showPrivacyModal() {
    alert(`数字永生计划隐私政策

1. 数据收集
   - 签到记录和日期
   - 设置的邮箱地址
   - 用户偏好设置

2. 数据存储
   - 所有数据存储在用户本地浏览器
   - 邮箱仅用于发送系统通知
   - 不会将数据上传到服务器

3. 数据安全
   - 使用本地存储保存数据
   - 邮箱仅用于通知功能
   - 用户可随时清除本地数据

4. 用户权利
   - 随时可导出个人数据
   - 可要求删除所有数据
   - 可关闭所有通知功能

5. 联系我们
   如有隐私问题，请联系: privacy@digital-immortality.lab
    
您的隐私对我们非常重要。`);
}

// 邮箱验证
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 矩阵背景特效
function initMatrixBackground() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const matrixBg = document.getElementById('matrixBg');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    matrixBg.appendChild(canvas);
    
    const letters = '010101010101010101010101011100110010010101010';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * canvas.height);
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(10, 14, 23, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff88';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            
            ctx.fillText(text, x, y);
            
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(draw, 35);
    
    // 窗口大小改变时重置canvas
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// 模拟发送邮件（实际项目中需要后端支持）
function simulateEmail(to, subject, body) {
    // 这里只是模拟，实际需要后端API
    console.log(`模拟发送邮件:
    收件人: ${to}
    主题: ${subject}
    内容: ${body}`);
    
    return true;
}

// 导出数据
function exportData() {
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `数字永生数据_${userData.id}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showMessage('数据导出成功！', 'success');
    addNotification('数据已导出', '你的数字生命数据已成功导出到本地', 'info');
}

// 导入数据
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            // 验证导入的数据
            if (isValidUserData(imported)) {
                if (confirm('确定要导入此数据吗？当前数据将被覆盖！')) {
                    userData = imported;
                    saveUserData();
                    updateUI();
                    showMessage('数据导入成功！', 'success');
                    setTimeout(() => location.reload(), 1500);
                }
            } else {
                showMessage('数据格式不正确！', 'error');
            }
        } catch (error) {
            console.error('导入失败:', error);
            showMessage('数据格式错误，导入失败！', 'error');
        }
    };
    reader.readAsText(file);
    
    // 重置input以便可以重复导入同一文件
    event.target.value = '';
}

// 触发导入
function triggerImport() {
    document.getElementById('importInput').click();
}

// 重置数据
function resetData() {
    if (confirm('⚠️ 警告：此操作将永久删除所有数据，包括签到记录、成就和设置。\n\n确定要重置数据吗？')) {
        if (confirm('最后确认：所有数据将无法恢复！')) {
            localStorage.removeItem('digitalImmortalityData');
            showMessage('数据已重置，页面即将刷新...', 'info');
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }
}

// 请求通知权限
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                notificationEnabled = true;
                showMessage('通知权限已开启', 'success');
                showNotification('数字永生计划', '你已成功开启桌面通知功能！', 'success');
            }
        });
    } else if (Notification.permission === 'granted') {
        notificationEnabled = true;
    }
}

// 显示浏览器通知
function showNotification(title, body, type = 'info') {
    if (!notificationEnabled || Notification.permission !== 'granted') return;
    
    const options = {
        body: body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%2300ff88"/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%2300ff88"/></svg>',
        tag: 'digital-immortality',
        requireInteraction: type === 'danger',
        silent: false
    };
    
    const notification = new Notification(title, options);
    
    notification.onclick = function() {
        window.focus();
        notification.close();
    };
}

// 设置每日提醒
function scheduleDailyReminder() {
    if (!userData.settings.dailyReminder) return;
    
    // 每小时检查一次是否需要提醒
    setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        const reminderHour = parseInt(userData.reminderTime);
        
        // 在设定的时间提醒，且今天还未签到
        if (hour === reminderHour && !isTodayCheckedIn()) {
            showNotification(
                '⏰ 签到提醒',
                '记得进行今日签到，维持你的数字生命能量！',
                'info'
            );
        }
        
        // 生命能量低于30%时提醒
        if (userData.lifeForce < 30 && userData.lifeForce > 0) {
            showNotification(
                '⚠️ 生命能量不足',
                `你的生命能量仅剩 ${Math.round(userData.lifeForce)}%，请尽快签到！`,
                'warning'
            );
        }
    }, 3600000); // 每小时检查
}

// 检查今天是否已签到
function isTodayCheckedIn() {
    if (!userData.lastCheckin) return false;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastCheckin = new Date(userData.lastCheckin);
    const lastCheckinDay = new Date(lastCheckin.getFullYear(), lastCheckin.getMonth(), lastCheckin.getDate());
    
    return lastCheckinDay.getTime() === today.getTime();
}

// 注册 Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker 注册成功:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker 注册失败:', error);
            });
    }
}

// 设置快捷键
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // 空格键签到
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            const checkinBtn = document.getElementById('checkinBtn');
            if (!checkinBtn.disabled) {
                performCheckin();
            }
        }
        
        // ESC 关闭弹窗
        if (e.code === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
        
        // Ctrl+E 导出数据
        if (e.ctrlKey && e.code === 'KeyE') {
            e.preventDefault();
            exportData();
        }
        
        // Ctrl+I 导入数据
        if (e.ctrlKey && e.code === 'KeyI') {
            e.preventDefault();
            triggerImport();
        }
    });
}

// 播放音效
function playSound(type) {
    // 使用Web Audio API生成简单音效
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'success') {
            // 成功音：清脆的叠加音
            oscillator.frequency.value = 523.25; // C5
            oscillator.start();
            setTimeout(() => {
                oscillator.frequency.value = 659.25; // E5
            }, 100);
            setTimeout(() => {
                oscillator.frequency.value = 783.99; // G5
            }, 200);
        } else if (type === 'warning') {
            // 警告音
            oscillator.frequency.value = 400;
        } else if (type === 'error') {
            // 错误音
            oscillator.frequency.value = 200;
        }
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        setTimeout(() => {
            oscillator.stop();
        }, 300);
    } catch (e) {
        // 静默失败，不影响功能
        console.log('音效播放失败:', e);
    }
}