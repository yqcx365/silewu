# 🚀 GitHub Pages 部署指南

## 快速部署步骤

### 1. 创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 `+` → `New repository`
3. 仓库名称建议：`digital-immortality` 或 `silewu`
4. 选择 `Public`（公开仓库才能使用免费的 GitHub Pages）
5. 不要勾选 "Add a README file"（我们已有 README）
6. 点击 `Create repository`

### 2. 上传代码到 GitHub

打开 PowerShell，在项目目录下执行：

```powershell
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 数字永生计划 v2.1.4"

# 添加远程仓库（替换 YOUR_USERNAME 和 YOUR_REPO）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 3. 启用 GitHub Pages

1. 进入仓库页面
2. 点击 `Settings`（设置）
3. 左侧菜单找到 `Pages`
4. 在 `Source` 部分：
   - Branch: 选择 `main`
   - Folder: 选择 `/ (root)`
5. 点击 `Save`

### 4. 等待部署完成

- 通常需要 1-3 分钟
- 刷新页面会看到绿色提示：`Your site is live at https://YOUR_USERNAME.github.io/YOUR_REPO/`
- 点击链接访问你的网站！

## 🔧 修改配置

### 更新 Open Graph URL

部署后，编辑 `index.html` 中的 URL：

```html
<!-- 将这些 URL 改为你的实际地址 -->
<meta property="og:url" content="https://YOUR_USERNAME.github.io/YOUR_REPO/">
<meta property="twitter:url" content="https://YOUR_USERNAME.github.io/YOUR_REPO/">
```

### 自定义域名（可选）

如果你有自己的域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 内容填写你的域名，如：`silewu.com`
3. 在域名提供商处添加 DNS 记录：
   ```
   类型: CNAME
   名称: @ 或 www
   值: YOUR_USERNAME.github.io
   ```

## 📝 更新网站

每次修改后：

```powershell
git add .
git commit -m "描述你的改动"
git push
```

GitHub Pages 会自动重新部署（1-3分钟）。

## ⚡ 常见问题

### Q: 显示 404 错误？
A: 等待几分钟，GitHub Pages 需要时间构建。如果还不行，检查 Settings → Pages 是否启用。

### Q: 样式或JS不加载？
A: 确保所有资源路径使用相对路径（`./` 或 `../`）。

### Q: Service Worker 不工作？
A: GitHub Pages 必须使用 HTTPS，这已自动启用。清除浏览器缓存重试。

### Q: 如何查看部署状态？
A: 仓库页面点击 `Actions` 标签查看部署进度。

## 🎉 优化建议

### 1. 启用 HTTPS（已自动）
GitHub Pages 自动提供免费的 HTTPS。

### 2. 添加 Google Analytics（可选）
在 `index.html` 的 `</head>` 前添加：
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. 启用 CDN 加速
GitHub Pages 已经使用 Fastly CDN，无需额外配置。

### 4. 压缩资源
使用在线工具压缩 CSS 和 JS：
- CSS: https://cssminifier.com/
- JS: https://jscompress.com/

## 📱 PWA 安装

部署后，用户可以：
1. 在 Chrome/Edge 浏览器访问网站
2. 点击地址栏右侧的 ⊕ 图标
3. 选择"安装"
4. 应用将添加到桌面/应用列表

## 🌟 推广你的项目

部署成功后：
1. 在 GitHub 仓库添加 Topics：`pwa` `checkin` `gamification`
2. 创建精美的 README
3. 添加预览截图
4. 分享到社交媒体

## 需要帮助？

- GitHub Pages 文档: https://docs.github.com/pages
- Git 教程: https://git-scm.com/book/zh/v2

---

祝你部署成功！🎊
