#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
   echo "Bu skriptni root foydalanuvchi sifatida ishga tushiring (sudo bash server-setup.sh)" >&2
   exit 1
fi

echo "==> System update"
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git ufw ca-certificates gnupg lsb-release

echo "==> Docker o'rnatish"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi

echo "==> Firewall (UFW) sozlash"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp comment 'HTTP / Certbot'
ufw allow 443/tcp comment 'HTTPS / Backend API'
ufw allow 1883/tcp comment 'MQTT (GPS qurilmalar)'
ufw allow 8883/tcp comment 'MQTTS (TLS GPS qurilmalar)'
ufw --force enable

echo "==> trackflow uchun katalog tayyorlash"
mkdir -p /opt/trackflow
chown -R "$SUDO_USER":"$SUDO_USER" /opt/trackflow 2>/dev/null || true

echo ""
echo "Server tayyor."
echo "Endi quyidagini bajaring:"
echo "  1) cd /opt/trackflow"
echo "  2) git clone https://github.com/trackflowdevelopers/trackflow.git ."
echo "  3) bash infrastructure/scripts/deploy.sh"
