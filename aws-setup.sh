#!/bin/bash
# ====================================================================
# iChatWorld — AWS Cloud Blueprint Auto-Deployment Script
# Works on: AWS Lightsail (Ubuntu 22.04/24.04), AWS EC2 (Ubuntu)
# Domain: ichatworld.xyz
# ====================================================================

set -e

echo "🚀 Starting iChatWorld AWS Deployment..."

# 1. Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx

# 2. Install Node.js 20 LTS
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

# 3. Install PM2 process manager globally
sudo npm install -g pm2

# 4. Clone or pull repo
APP_DIR="/var/www/ichatworld"
if [ ! -d "$APP_DIR" ]; then
  echo "📥 Cloning repository into $APP_DIR..."
  sudo git clone https://github.com/pwnjoshi/iChatWorld.git "$APP_DIR"
  sudo chown -R $USER:$USER "$APP_DIR"
else
  echo "🔄 Updating existing repository in $APP_DIR..."
  cd "$APP_DIR"
  git pull origin main
fi

cd "$APP_DIR"

# 5. Install dependencies and build project
echo "🔨 Building Full-Stack App (Server TypeScript + Client Vite)..."
npm install
npm run build

# 6. Configure environment
if [ ! -f "$APP_DIR/server/.env" ]; then
  echo "⚙️ Creating server/.env configuration..."
  cat <<EOT > "$APP_DIR/server/.env"
PORT=3001
CORS_ORIGIN=*
FACULTY_PASSPHRASE=faculty123
NEBIUS_API_KEY=\${NEBIUS_API_KEY:-your_nebius_api_key_here}
NEBIUS_BASE_URL=https://api.tokenfactory.us-central1.nebius.com/v1/
NEBIUS_MODEL=deepseek-ai/DeepSeek-V4-Flash
RESEND_API_KEY=\${RESEND_API_KEY:-your_resend_api_key_here}
RESEND_FROM_EMAIL=iChatWorld <info@ichatworld.xyz>
EOT
fi

# 7. Start / Restart Node server with PM2
pm2 stop ichatworld 2>/dev/null || true
pm2 delete ichatworld 2>/dev/null || true
pm2 start server/dist/server.js --name "ichatworld" -i max
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

# 8. Configure Nginx Reverse Proxy with WebSocket support
echo "🌐 Configuring Nginx Reverse Proxy for ichatworld.xyz..."
sudo tee /etc/nginx/sites-available/ichatworld > /dev/null << 'EOF'
server {
    listen 80;
    server_name ichatworld.xyz www.ichatworld.xyz;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/ichatworld /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 9. Configure Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "========================================================"
echo "✅ iChatWorld is running on http://127.0.0.1:3001 and Nginx!"
echo ""
echo "To attach Free SSL Certificate for ichatworld.xyz, run:"
echo "sudo certbot --nginx -d ichatworld.xyz -d www.ichatworld.xyz"
echo "========================================================"
