#!/usr/bin/env bash
set -e
BASE="/home/sosal/projects/ZV/node_modules/.pnpm/@prisma+engines@6.15.0/node_modules/@prisma/engines"
URL_BASE="https://binaries.prisma.sh/all_commits/85179d7826409ee107a6ba334b5e305ae3fba9fb/debian-openssl-3.0.x"
cd "/home/sosal/projects/ZV/node_modules/.pnpm/@prisma+engines@6.15.0/node_modules/@prisma/engines"
echo "[Чт 28 авг 2025 17:13:14 MSK] Starting downloads into /home/sosal/projects/ZV/node_modules/.pnpm/@prisma+engines@6.15.0/node_modules/@prisma/engines"
if command -v aria2c >/dev/null 2>&1; then
  echo "Using aria2c"
  aria2c -x 8 -s 8 -c "https://binaries.prisma.sh/all_commits/85179d7826409ee107a6ba334b5e305ae3fba9fb/debian-openssl-3.0.x/schema-engine.gz" -o schema-engine-debian-openssl-3.0.x.gz
  aria2c -x 8 -s 8 -c "https://binaries.prisma.sh/all_commits/85179d7826409ee107a6ba334b5e305ae3fba9fb/debian-openssl-3.0.x/libquery_engine.so.node.gz" -o libquery_engine-debian-openssl-3.0.x.so.node.gz
else
  echo "Using curl"
  curl -L --retry 20 --retry-delay 2 -C - -o schema-engine-debian-openssl-3.0.x.gz "https://binaries.prisma.sh/all_commits/85179d7826409ee107a6ba334b5e305ae3fba9fb/debian-openssl-3.0.x/schema-engine.gz"
  curl -L --retry 20 --retry-delay 2 -C - -o libquery_engine-debian-openssl-3.0.x.so.node.gz "https://binaries.prisma.sh/all_commits/85179d7826409ee107a6ba334b5e305ae3fba9fb/debian-openssl-3.0.x/libquery_engine.so.node.gz"
fi
ls -la
echo "Unpacking..."
gunzip -f schema-engine-debian-openssl-3.0.x.gz
gunzip -f libquery_engine-debian-openssl-3.0.x.so.node.gz
chmod +x schema-engine-debian-openssl-3.0.x
ls -la
echo "[Чт 28 авг 2025 17:13:14 MSK] Done"
