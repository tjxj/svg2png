#!/usr/bin/env node
/**
 * SVG to PNG 转换脚本
 * 用于 macOS Quick Action
 * 
 * 用法: 
 *   node convert.js <svg文件路径>
 *   node convert.js <svg文件1> <svg文件2> ...
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng(svgPath) {
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // 从 SVG 提取尺寸
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

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    await page.setViewport({
        width: width,
        height: height,
        deviceScaleFactor: 2
    });

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
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
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

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 300));

    const pngPath = svgPath.replace(/\.svg$/i, '.png');

    await page.screenshot({
        path: pngPath,
        type: 'png',
        clip: { x: 0, y: 0, width: width, height: height },
        omitBackground: false
    });

    await browser.close();

    return pngPath;
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('用法: node convert.js <svg文件路径> [更多文件...]');
        process.exit(1);
    }

    const svgFiles = args.filter(f => f.endsWith('.svg') && fs.existsSync(f));

    if (svgFiles.length === 0) {
        console.error('未找到有效的 SVG 文件');
        process.exit(1);
    }

    console.log(`开始转换 ${svgFiles.length} 个文件...`);

    for (const svgPath of svgFiles) {
        try {
            const pngPath = await convertSvgToPng(svgPath);
            console.log(`✅ ${path.basename(svgPath)} → ${path.basename(pngPath)}`);
        } catch (error) {
            console.error(`❌ ${path.basename(svgPath)}: ${error.message}`);
        }
    }

    console.log('转换完成！');
}

main().catch(console.error);
