#!/usr/bin/env bash
# =========================================================================================
# Script biên dịch & nạp firmware HydroWatch cho NodeMCU ESP8266
# =========================================================================================
# TẠI SAO CẦN SCRIPT NÀY?
#   Core ESP8266 (mkbuildoptglobals.py) không xử lý được ký tự tiếng Việt có dấu trong
#   đường dẫn. Biên dịch trực tiếp tại "D:\IOT\đồ án\firmware" sẽ lỗi:
#       UnicodeEncodeError: 'charmap' codec can't encode characters ...
#   Script copy sketch sang thư mục tạm có đường dẫn ASCII thuần rồi mới biên dịch.
#   Arduino IDE bản giao diện cũng dính lỗi này — phải dùng script.
#
# CÁCH DÙNG
#   bash build.sh                 # chỉ biên dịch
#   bash build.sh upload COM5     # biên dịch rồi nạp vào cổng COM5
#   bash build.sh list            # liệt kê cổng COM đang có
# =========================================================================================

set -euo pipefail

SKETCH_NAME="water_pressure_node"
FQBN="esp8266:esp8266:nodemcuv2"
BUILD_ROOT="/tmp/hydrowatch_build"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="${SCRIPT_DIR}/${SKETCH_NAME}"

# --- Tìm arduino-cli -------------------------------------------------------------------
if command -v arduino-cli >/dev/null 2>&1; then
  CLI="arduino-cli"
elif [ -x "/c/Program Files/Arduino CLI/arduino-cli.exe" ]; then
  CLI="/c/Program Files/Arduino CLI/arduino-cli.exe"
else
  echo "[LỖI] Không tìm thấy arduino-cli." >&2
  echo "      Cài bằng: winget install ArduinoSA.CLI" >&2
  exit 127
fi

# --- Lệnh phụ: liệt kê cổng ------------------------------------------------------------
if [ "${1:-}" = "list" ]; then
  exec "$CLI" board list
fi

# --- Kiểm tra sketch tồn tại -----------------------------------------------------------
if [ ! -f "${SRC_DIR}/${SKETCH_NAME}.ino" ]; then
  echo "[LỖI] Không thấy ${SRC_DIR}/${SKETCH_NAME}.ino" >&2
  exit 1
fi

# --- Copy sang đường dẫn ASCII thuần ---------------------------------------------------
echo "[1/2] Copy sketch sang đường dẫn ASCII: ${BUILD_ROOT}"
rm -rf "${BUILD_ROOT}"
mkdir -p "${BUILD_ROOT}"
cp -r "${SRC_DIR}" "${BUILD_ROOT}/"

CURRENT_FLAG="$(grep -oE '#define[[:space:]]+SIMULATE_SENSOR[[:space:]]+[01]' \
  "${SRC_DIR}/${SKETCH_NAME}.ino" | grep -oE '[01]$' || echo '?')"
echo "      SIMULATE_SENSOR = ${CURRENT_FLAG}"

# --- Biên dịch -------------------------------------------------------------------------
echo "[2/2] Biên dịch (FQBN: ${FQBN})"
cd "${BUILD_ROOT}"
set +e
"$CLI" compile --fqbn "${FQBN}" "${SKETCH_NAME}"
COMPILE_RC=$?
set -e

if [ $COMPILE_RC -ne 0 ]; then
  echo ""
  echo "[THẤT BẠI] Biên dịch lỗi, mã thoát ${COMPILE_RC}" >&2
  exit $COMPILE_RC
fi

echo ""
echo "[OK] Biên dịch thành công."

# --- Nạp (tuỳ chọn) --------------------------------------------------------------------
if [ "${1:-}" = "upload" ]; then
  PORT="${2:-}"
  if [ -z "$PORT" ]; then
    echo "[LỖI] Thiếu cổng COM. Ví dụ: bash build.sh upload COM5" >&2
    echo "      Xem cổng đang có: bash build.sh list" >&2
    exit 2
  fi
  echo ""
  echo "[3/3] Nạp vào ${PORT}"
  "$CLI" upload -p "$PORT" --fqbn "${FQBN}" "${SKETCH_NAME}"
  echo "[OK] Nạp xong."
fi
