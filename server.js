/**
 * SVG to PNG Web Service
 * 支持单个和批量 SVG 转 PNG，完美支持 foreignObject
 */

const express = require('express');
const multer = require('multer');
const puppeteer = require('puppeteer');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置文件上传
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/svg+xml' || file.originalname.endsWith('.svg')) {
            cb(null, true);
        } else {
            cb(new Error('只支持 SVG 文件'));
        }
    }
});

// 临时目录
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 从 SVG 内容提取尺寸
function extractDimensions(svgContent) {
    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
    const widthMatch = svgContent.match(/width=["'](\d+)/);
    const heightMatch = svgContent.match(/height=["'](\d+)/);

    let width = 900, height = 1200;

    if (viewBoxMatch) {
        const parts = viewBoxMatch[1].split(/\s+/).map(Number);
        width = parts[2] || width;
        height = parts[3] || height;
    } else {
        width = widthMatch ? parseInt(widthMatch[1]) : width;
        height = heightMatch ? parseInt(heightMatch[1]) : height;
    }

    return { width, height };
}

// SVG 转 PNG 核心函数（每次创建新浏览器实例）
async function convertSvgToPng(svgContent, options = {}) {
    const { scale = 2 } = options;
    const { width, height } = extractDimensions(svgContent);

    // 每次创建新的浏览器实例，避免连接问题
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    try {
        const page = await browser.newPage();

        // 设置视口
        await page.setViewport({
            width: width,
            height: height,
            deviceScaleFactor: scale
        });

        // 创建 HTML 包装器
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
    }
    svg {
      display: block;
      width: ${width}px;
      height: ${height}px;
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

        // 等待字体加载
        await page.evaluate(() => document.fonts.ready);
        await new Promise(resolve => setTimeout(resolve, 500));

        const pngBuffer = await page.screenshot({
            type: 'png',
            clip: {
                x: 0,
                y: 0,
                width: width,
                height: height
            },
            omitBackground: false
        });

        await page.close();

        return {
            buffer: pngBuffer,
            dimensions: { width: width * scale, height: height * scale }
        };
    } finally {
        await browser.close();
    }
}

// 静态文件服务
app.use(express.static('public'));
app.use(express.json());

// 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 单个 SVG 转换
app.post('/api/convert', upload.single('svg'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请上传 SVG 文件' });
        }

        const svgContent = req.file.buffer.toString('utf-8');
        const scale = parseInt(req.body.scale) || 2;

        console.log(`转换文件: ${req.file.originalname}, 倍率: ${scale}x`);

        const { buffer, dimensions } = await convertSvgToPng(svgContent, { scale });

        const filename = req.file.originalname.replace('.svg', '.png');

        res.set({
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'X-Image-Width': dimensions.width,
            'X-Image-Height': dimensions.height
        });

        console.log(`转换成功: ${filename}, 尺寸: ${dimensions.width}x${dimensions.height}`);
        res.send(buffer);
    } catch (error) {
        console.error('转换错误:', error.message);
        res.status(500).json({ error: error.message || '转换失败，请重试' });
    }
});

// 批量 SVG 转换
app.post('/api/convert-batch', upload.array('svgs', 50), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '请上传 SVG 文件' });
        }

        const scale = parseInt(req.body.scale) || 2;
        const sessionId = uuidv4();
        const sessionDir = path.join(TEMP_DIR, sessionId);
        fs.mkdirSync(sessionDir, { recursive: true });

        console.log(`批量转换: ${req.files.length} 个文件, 倍率: ${scale}x`);

        // 转换所有文件
        for (const file of req.files) {
            try {
                const svgContent = file.buffer.toString('utf-8');
                const { buffer } = await convertSvgToPng(svgContent, { scale });

                const pngFilename = file.originalname.replace('.svg', '.png');
                const pngPath = path.join(sessionDir, pngFilename);
                fs.writeFileSync(pngPath, buffer);

                console.log(`✅ ${file.originalname}`);
            } catch (err) {
                console.error(`❌ ${file.originalname}: ${err.message}`);
            }
        }

        // 创建 ZIP
        const zipPath = path.join(TEMP_DIR, `${sessionId}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        archive.directory(sessionDir, false);

        await new Promise((resolve, reject) => {
            output.on('close', resolve);
            archive.on('error', reject);
            archive.finalize();
        });

        // 发送 ZIP
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="svg-to-png-${Date.now()}.zip"`
        });

        const zipBuffer = fs.readFileSync(zipPath);
        res.send(zipBuffer);

        console.log(`批量转换完成, ZIP 大小: ${(zipBuffer.length / 1024).toFixed(1)}KB`);

        // 清理临时文件
        setTimeout(() => {
            try {
                fs.rmSync(sessionDir, { recursive: true, force: true });
                fs.unlinkSync(zipPath);
            } catch (e) { }
        }, 5000);

    } catch (error) {
        console.error('批量转换错误:', error.message);
        res.status(500).json({ error: error.message || '转换失败，请重试' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SVG to PNG 服务运行在 http://localhost:${PORT}`);
});
