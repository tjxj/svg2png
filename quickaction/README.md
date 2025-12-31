# macOS Quick Action - SVG to PNG 转换器

在 Finder 中右键点击 SVG 文件，即可快速转换为 PNG。

## 📦 安装步骤

### 步骤 1：安装依赖

```bash
cd ~/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/zhangAI/1-Wechat/svg-to-png-quickaction

# 安装 Node.js 依赖
npm install

# 设置脚本执行权限
chmod +x svg2png.sh
chmod +x convert.js
```

### 步骤 2：创建 Quick Action

1. **打开 Automator**
   - 按 `Cmd + Space`，搜索 "Automator"，打开

2. **创建新文档**
   - 选择 **"Quick Action"**（快速操作）

3. **配置工作流程**
   - 在顶部设置：
     - **工作流程收到当前**：`文件或文件夹`
     - **位于**：`Finder.app`
     - **图像**：选择一个图标（可选）

4. **添加 "Run Shell Script" 动作**
   - 在左侧搜索 "Run Shell Script"
   - 拖到右侧工作区

5. **配置 Shell 脚本**
   - **Shell**：`/bin/bash`
   - **传递输入**：`作为自变量`
   - 在脚本框中输入：

```bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
SCRIPT_DIR="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/zhangAI/1-Wechat/svg-to-png-quickaction"

for f in "$@"; do
    if [[ "$f" == *.svg ]]; then
        node "$SCRIPT_DIR/convert.js" "$f"
    fi
done

osascript -e 'display notification "SVG 转换完成！" with title "SVG to PNG"'
```

6. **保存 Quick Action**
   - 按 `Cmd + S`
   - 命名为：`SVG to PNG`

### 步骤 3：使用方法

1. 在 Finder 中找到 SVG 文件
2. **右键点击** SVG 文件
3. 选择 **"快速操作"** > **"SVG to PNG"**
4. PNG 文件会生成在同一目录下

## 🎯 支持

- ✅ 单个 SVG 文件转换
- ✅ 批量选择多个 SVG 文件
- ✅ 完美支持 foreignObject
- ✅ 2x 高清输出
- ✅ 系统通知反馈

## 🔧 自定义

### 修改输出倍率

编辑 `convert.js`，找到 `deviceScaleFactor: 2`，改为你需要的倍率：
- `1`：原始尺寸
- `2`：2x 高清（默认）
- `3`：3x 超高清

### 添加到 Touch Bar

1. 打开 **系统设置** > **键盘** > **自定义功能栏**
2. 将 Quick Action 拖到 Touch Bar

## ❓ 故障排除

### 问题：找不到 node 命令

确保 Node.js 在 PATH 中：

```bash
# 查看 node 路径
which node

# 如果不在 /opt/homebrew/bin，修改脚本中的 PATH
```

### 问题：Quick Action 不显示

1. 打开 Finder
2. 右键任意文件
3. 点击 **"自定义..."**
4. 确保 "SVG to PNG" 已勾选

### 问题：转换失败

检查是否安装了 Puppeteer 依赖的 Chrome：

```bash
cd svg-to-png-quickaction
node -e "require('puppeteer').executablePath()"
```

## 📝 License

MIT
