#!/usr/bin/env bash
# 停止脚本：用 ss 提取监听 8000 端口的 PID 并结束进程
# 不对 ss/kill 追加 2>/dev/null，避免吞掉 command not found 等错误
set -u

PORT=8000

get_pids() {
  ss -ltnp | grep ":${PORT} " | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u
}

pids=$(get_pids)
if [ -z "$pids" ]; then
  echo "服务未运行 (port ${PORT})"
  exit 0
fi

# 优雅停止
for p in $pids; do
  kill "$p"
done

# 等待端口释放
i=0
while [ "$i" -lt 40 ]; do
  if ! ss -ltn | grep -q ":${PORT} "; then
    echo "服务已停止 (port ${PORT})"
    exit 0
  fi
  i=$((i + 1))
  sleep 0.25
done

# 仍未退出则强制结束
pids=$(get_pids)
for p in $pids; do
  kill -9 "$p"
done

sleep 0.3
echo "服务已强制停止 (port ${PORT})"
exit 0
