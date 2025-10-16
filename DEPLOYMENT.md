# TOE AI Deployment Guide

This guide covers deploying TOE AI to a Hostinger VPS using Coolify or Docker Compose.

## 📋 Prerequisites

### System Requirements
- **Server**: Linux VPS (Ubuntu 20.04+ recommended)
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 20GB, recommended 40GB+
- **CPU**: 2+ cores recommended

### Required Software
- Docker (20.10+)
- Docker Compose (2.0+)
- Git
- Coolify (optional, for easier management)

## 🚀 Quick Deployment with Docker Compose

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/toe_ai.git
cd toe_ai
```

### 2. Configure Environment Variables
```bash
# Copy the production environment template
cp .env.production .env

# Edit the .env file with your actual values
nano .env
```

**Required Environment Variables:**
```bash
# Security
SECRET_KEY=your-super-secure-production-secret-key-minimum-32-characters

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Stripe
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Frontend
VITE_API_URL=https://api.yourdomain.com

# CORS
ALLOWED_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]
```

### 3. Deploy the Application
```bash
# Make the deployment script executable
chmod +x deploy.sh

# Deploy the application
./deploy.sh deploy
```

### 4. Verify Deployment
```bash
# Check application status
./deploy.sh status

# View logs
docker-compose logs -f
```

## 🌐 Coolify Deployment

### 1. Install Coolify on Your VPS
```bash
curl -fsSL https://get.docker.com | sh
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### 2. Access Coolify Dashboard
- Open your browser and go to `http://your-vps-ip:3000`
- Complete the initial setup

### 3. Create New Project
1. Click "New Project" in Coolify dashboard
2. Choose "Git Repository"
3. Enter your repository URL: `https://github.com/yourusername/toe_ai.git`
4. Select branch: `main`

### 4. Configure Services

#### Frontend Service
- **Name**: `toe-ai-frontend`
- **Port**: `80`
- **Dockerfile**: `./frontend/Dockerfile`
- **Domain**: `yourdomain.com`
- **Environment Variables**:
  ```
  VITE_API_URL=https://api.yourdomain.com
  ```

#### Backend Service
- **Name**: `toe-ai-backend`
- **Port**: `8000`
- **Dockerfile**: `./backend/Dockerfile.prod`
- **Domain**: `api.yourdomain.com`
- **Environment Variables**: (Add all variables from `.env` file)

### 5. Deploy
Click "Deploy" in Coolify dashboard and monitor the deployment progress.

## 🔧 Manual VPS Setup (Ubuntu)

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Install Git and Clone Repository
```bash
sudo apt install git -y
git clone https://github.com/yourusername/toe_ai.git
cd toe_ai
```

### 4. Configure Firewall
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8000  # Backend API port
sudo ufw enable
```

### 5. Set Up SSL (Optional but Recommended)

#### Using Certbot for Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

#### Update Nginx Configuration for SSL
Create `/etc/nginx/sites-available/toe-ai`:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🛠️ Management Commands

### View Application Status
```bash
docker-compose ps
```

### View Logs
```bash
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backup Data
```bash
# Backup uploaded files
sudo tar -czf toe_ai_uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C / var/lib/docker/volumes/toe_ai_backend_uploads/_data

# Backup database (if using local PostgreSQL)
# docker-compose exec db pg_dump -U toeai toeai > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Stop Application
```bash
docker-compose down
```

### Complete Cleanup
```bash
./deploy.sh cleanup
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 80 or 8000
sudo lsof -i :80
sudo lsof -i :8000

# Kill the process if needed
sudo kill -9 <PID>
```

#### 2. Permission Denied for Docker
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### 3. Out of Disk Space
```bash
# Clean up Docker
docker system prune -a --volumes

# Check disk usage
df -h
```

#### 4. Container Won't Start
```bash
# Check container logs
docker-compose logs <service_name>

# Check Docker daemon status
sudo systemctl status docker
```

### Health Check Endpoints
- Frontend: `http://yourdomain.com/health`
- Backend: `http://api.yourdomain.com/docs`

## 📊 Monitoring

### Basic Monitoring
```bash
# Monitor resource usage
docker stats

# Monitor logs in real-time
docker-compose logs -f --tail=100
```

### Advanced Monitoring (Optional)
Consider setting up:
- Grafana + Prometheus for metrics
- ELK Stack for log aggregation
- Uptime monitoring (UptimeRobot, Pingdom, etc.)

## 🔒 Security Considerations

1. **Environment Variables**: Never commit real environment variables to version control
2. **SSL/TLS**: Always use HTTPS in production
3. **Firewall**: Only open necessary ports
4. **Updates**: Regularly update Docker images and system packages
5. **Backups**: Implement regular backup strategy
6. **Monitoring**: Set up monitoring and alerting

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables are correctly set
3. Ensure all required services are running
4. Check firewall and networking configuration
5. Review the troubleshooting section above

## 🔄 CI/CD Setup (Optional)

For automated deployments, consider setting up GitHub Actions:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /path/to/toe_ai
            git pull origin main
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
```