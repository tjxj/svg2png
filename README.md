# SVG to PNG

在线 SVG 转 PNG 工具，**完美支持 foreignObject**。

🔗 **在线体验：[svg.zhanglearning.com](https://svg.zhanglearning.com)**

![screenshot](https://svg.zhanglearning.com/screenshot.png)

## ✨ 特性

- 🎨 **完美渲染** - 基于 Puppeteer，完美支持 foreignObject
- 📦 **批量转换** - 支持最多 50 个文件同时转换，ZIP 打包下载
- 🔥 **高清输出** - 支持 1x / 2x / 3x 倍率输出
- 🚀 **拖拽上传** - 现代化拖拽交互体验
- 💯 **免费使用** - 完全开源免费，无水印

## 🚀 本地运行

```bash
# 克隆项目
git clone https://github.com/zhanglearning/svg2png.git
cd svg2png

# 安装依赖
npm install

# 启动服务
npm run dev
```

访问 http://localhost:3000

## 📦 部署

### Railway (推荐)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/xxx)

```bash
railway up
```

### Render

连接 GitHub 仓库即可自动部署。

### Docker

```bash
docker build -t svg2png .
docker run -p 3000:3000 svg2png
```

### VPS

```bash
# 安装 Node.js 18+
# 安装 Chrome 依赖
apt-get install -y chromium-browser

# 克隆项目
git clone https://github.com/zhanglearning/svg2png.git
cd svg2png

# 安装依赖
npm install

# 使用 PM2 运行
npm install -g pm2
pm2 start server.js --name svg2png
```

## 📡 API

### 单个文件转换

```bash
POST /api/convert
Content-Type: multipart/form-data

# 参数
- svg: SVG 文件
- scale: 输出倍率 (1, 2, 3)，默认 2

# 返回
PNG 文件
```

### 批量转换

```bash
POST /api/convert-batch
Content-Type: multipart/form-data

# 参数
- svgs: 多个 SVG 文件
- scale: 输出倍率 (1, 2, 3)，默认 2

# 返回
ZIP 文件
```

### 命令行使用

```bash
# 单个文件
curl -X POST -F "svg=@input.svg" -F "scale=2" \
  https://svg.zhanglearning.com/api/convert \
  --output output.png

# 批量文件
curl -X POST -F "svgs=@file1.svg" -F "svgs=@file2.svg" -F "scale=2" \
  https://svg.zhanglearning.com/api/convert-batch \
  --output output.zip
```

## 🖱️ macOS Quick Action

还提供 macOS 右键菜单工具，详见 [quickaction/README.md](./quickaction/README.md)

## 📝 为什么做这个？

大多数 SVG 转 PNG 工具（如 `rsvg-convert`、`inkscape`）不支持 `foreignObject`，导致使用 HTML 内容实现自动换行的 SVG 文件无法正确转换。

本工具使用 Puppeteer 在真实浏览器环境中渲染 SVG，完美支持所有 SVG 特性。

## 📄 License

MIT

---

Made with ❤️ by [zhanglearning](https://github.com/zhanglearning)
