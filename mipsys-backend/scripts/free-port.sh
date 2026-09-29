#!/usr/bin/env bash
# Bebaskan PORT backend sebelum start agar tidak EADDRINUSE saat ada
# instance lama/duplikat yang masih jalan (mis. lupa dimatikan atau
# watch-mode restart yang gagal). Aman jika port sedang bebas.
PORT="${PORT:-3001}"
fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
# Beri waktu OS melepas socket sebelum bind baru
sleep 1
exit 0
