# 🔧 Production SSL Configuration Fix

## 🚨 **Current Issue**
- SSL Protocol Error: `net::ERR_SSL_PROTOCOL_ERROR`
- Backend running on port 8001 with HTTPS
- Frontend can't connect to backend

## ✅ **Solutions**

### **1. Update Backend Environment Variables**

```bash
# Backend .env
# Remove port 8001 - use standard HTTPS port 443
BACKEND_URL=https://toe-back.diversis.site

# Update CORS for production
ALLOWED_ORIGINS=https://toe.diversis.site,https://www.toe.diversis.site

# Set environment to production
ENVIRONMENT=production
```

### **2. Update Frontend Environment Variables**

```bash
# Frontend .env
# Remove port 8001 - use standard HTTPS port 443
VITE_API_BASE_URL=https://toe-back.diversis.site/api/v1
```

### **3. Docker/Server Configuration**

If you're using Docker, update your docker-compose.yml:

```yaml
services:
  backend:
    ports:
      - "443:8000"  # Map HTTPS port 443 to container port 8000
    environment:
      - BACKEND_URL=https://toe-back.diversis.site
      - ALLOWED_ORIGINS=https://toe.diversis.site,https://www.toe.diversis.site
```

### **4. Nginx Configuration (if using Nginx)**

```nginx
server {
    listen 443 ssl;
    server_name toe-back.diversis.site;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **5. SSL Certificate Requirements**

Make sure your SSL certificate:
- ✅ Covers `toe-back.diversis.site`
- ✅ Is valid and not expired
- ✅ Is properly installed on your server
- ✅ Supports HTTPS on port 443 (standard)

## 🔄 **Step-by-Step Fix**

### **Step 1: Update Environment Variables**
1. Update backend `.env` file
2. Update frontend `.env` file
3. Remove port 8001 from all URLs

### **Step 2: Restart Services**
1. Restart your backend service
2. Restart your frontend service
3. Clear any cached configurations

### **Step 3: Test Connection**
1. Test backend directly: `https://toe-back.diversis.site/api/v1/health`
2. Test frontend to backend connection
3. Check browser network tab for errors

### **Step 4: Verify SSL**
1. Check SSL certificate validity
2. Ensure HTTPS is working on port 443
3. Test with `curl -k https://toe-back.diversis.site/api/v1/health`

## 🧪 **Testing Commands**

```bash
# Test backend health
curl -k https://toe-back.diversis.site/api/v1/health

# Test SSL certificate
openssl s_client -connect toe-back.diversis.site:443

# Test from frontend
# Open browser console and check network requests
```

## 🚨 **Common Issues**

1. **Port 8001**: Remove this port, use standard HTTPS port 443
2. **SSL Certificate**: Make sure it's valid and covers your domain
3. **CORS**: Update ALLOWED_ORIGINS with your frontend domain
4. **Environment**: Set ENVIRONMENT=production

## ✅ **Expected Result**

After fixing:
- ✅ Frontend: `https://toe.diversis.site`
- ✅ Backend: `https://toe-back.diversis.site/api/v1`
- ✅ No SSL errors
- ✅ Google OAuth works
- ✅ All API calls succeed

## 📞 **If Still Having Issues**

1. Check server logs for SSL errors
2. Verify SSL certificate installation
3. Test with a simple curl command
4. Check firewall/security group settings
5. Ensure port 443 is open and accessible
