#!/usr/bin/env bash
# Chạy toàn bộ kiểm thử và ghi 1 dòng kết quả vào cuối TESTING.md.
# Cách dùng:  bash tests/run-all.sh "ghi chú ngắn về đợt sửa"
# Giao diện cần Playwright; trong môi trường Claude đặt CHROME và PW_PATH (xem CLAUDE.md).
cd "$(dirname "$0")/.."
NOTE="${1:-}"
FAIL=0

# 1. Cú pháp giao diện
sed -n '/<script>$/,/<\/script>/p' apps-script/Index.html | sed '1d;$d' > /tmp/app.js
if node --check /tmp/app.js; then SYN="đạt"; else SYN="LỖI"; FAIL=1; fi

# 2. Máy chủ
GAS_OUT=$(node tests/gastest.js 2>&1); GAS_RC=$?
GAS_OK=$(grep -c '^ok' <<<"$GAS_OUT"); GAS_F=$(grep -c '^FAIL' <<<"$GAS_OUT")
grep '^FAIL' <<<"$GAS_OUT"
[ $GAS_RC -ne 0 ] && FAIL=1

# 3. Giao diện
UI_OUT=$(node tests/ui.js 2>&1); UI_RC=$?
if grep -q "Cannot find module" <<<"$UI_OUT"; then
  UI="bỏ qua (chưa cài Playwright)"
else
  UI_OK=$(grep -c '^ok' <<<"$UI_OUT"); UI_F=$(grep -c '^FAIL' <<<"$UI_OUT")
  grep '^FAIL' <<<"$UI_OUT"
  UI="$UI_OK đạt / $UI_F lỗi"
  [ $UI_RC -ne 0 ] && FAIL=1
fi

KQ=$([ $FAIL -eq 0 ] && echo "✅ ĐẠT" || echo "❌ LỖI")
ROW="| $(date '+%Y-%m-%d %H:%M') | $(git rev-parse --short HEAD) | $SYN | $GAS_OK đạt / $GAS_F lỗi | $UI | $KQ | $NOTE |"
echo "$ROW" >> TESTING.md
echo "$KQ — đã ghi vào TESTING.md:"; echo "$ROW"
exit $FAIL
