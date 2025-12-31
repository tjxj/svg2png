#!/bin/bash
# SVG to PNG Quick Action 包装脚本
# 这个脚本会被 Automator Quick Action 调用

# 设置 Node.js 路径（根据你的安装路径调整）
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# 脚本目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 运行转换
node "$SCRIPT_DIR/convert.js" "$@"

# 完成通知
if [ $? -eq 0 ]; then
    osascript -e 'display notification "SVG 已成功转换为 PNG" with title "SVG to PNG"'
else
    osascript -e 'display notification "转换过程中出现错误" with title "SVG to PNG" sound name "Basso"'
fi
