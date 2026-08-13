#!/usr/bin/env bash
# سكربت تشغيل/إيقاف بوت مراقبة سيرفر SandMC
# الاستخدام:
#   ./run.sh        -> تشغيل البوت في الخلفية
#   ./run.sh start  -> تشغيل البوت في الخلفية
#   ./run.sh stop   -> إيقاف البوت
#   ./run.sh restart-> إعادة التشغيل
#   ./run.sh logs   -> متابعة السجل (Ctrl+C للخروج)

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

PID_FILE="$DIR/bot.pid"
LOG_FILE="$DIR/bot.log"

start() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "البوت يعمل بالفعل (PID $(cat "$PID_FILE"))."
    return
  fi
  nohup node index.js > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  echo "✅ تم تشغيل البوت (PID $!). السجل: $LOG_FILE"
}

stop() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    kill "$(cat "$PID_FILE")"
    rm -f "$PID_FILE"
    echo "🛑 تم إيقاف البوت."
  else
    echo "البوت لا يعمل."
  fi
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  restart) stop; sleep 1; start ;;
  logs) tail -f "$LOG_FILE" ;;
  *) echo "استخدام: ./run.sh [start|stop|restart|logs]" ;;
esac