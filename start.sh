#!/usr/bin/env bash
# 启动脚本：静态站点服务（端口固定 8000，不改变）
# 返回码：0 = 已启动 或 启动成功；2 = 启动失败
set -u

PORT=8000
HOST=0.0.0.0
ROOT="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$ROOT/.run"
LOG_FILE="$RUN_DIR/server.log"

mkdir -p "$RUN_DIR"

port_listening() {
  ss -ltn | grep -q ":${PORT} "
}

# 1) 已启动则直接返回 0
if port_listening; then
  echo "服务已在运行：http://127.0.0.1:${PORT}/"
  exit 0
fi

# 2) 先终止残留旧进程（统一走 stop.sh，避免直接 kill 残留子进程占端口）
bash "$ROOT/stop.sh" || true

# 3) 清理构建缓存：本项目为纯静态、无构建产物，无需清理。
#    若将来引入构建流程，可在此清理，例如：rm -rf "$ROOT/dist"

# 4) 启动服务
#    - 禁止使用 timeout（会导致服务被自动结束）
#    - 环境变量先 export，再交给 nohup（nohup 只把可执行文件作为第一个参数）
if ! command -v python3 >/dev/null; then
  echo "未找到 python3，无法启动服务" >&2
  exit 2
fi

export PORT HOST
nohup python3 "$ROOT/server.py" >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# 5) 等待端口就绪并校验 HTTP 可访问（就绪轮询，不是启动超时；服务会持续运行）
i=0
while [ "$i" -lt 60 ]; do
  if port_listening; then
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/")
    if [ "$code" = "200" ]; then
      echo "服务启动成功：http://127.0.0.1:${PORT}/ (pid ${SERVER_PID})"
      exit 0
    fi
  fi
  i=$((i + 1))
  sleep 0.25
done

echo "服务启动失败，请查看日志：$LOG_FILE" >&2
exit 2
