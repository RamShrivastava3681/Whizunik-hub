#!/bin/bash

# WhizUnik Portal - Frontend Build Script for Hostinger
# Run this script locally to prepare frontend for Hostinger deployment

echo "🚀 Building WhizUnik Portal Frontend for Hostinger..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the project root directory (where package.json is located)"
    exit 1
fi

# Get VPS domain from user
echo "🌐 Enter your VPS domain or IP address (e.g., api.yourdomain.com or 123.456.789.0):"
read -p "VPS Domain/IP: " VPS_DOMAIN

if [ -z "$VPS_DOMAIN" ]; then
    echo "❌ VPS domain/IP is required!"
    exit 1
fi

# Create production environment for Hostinger
print_status "Creating production environment configuration..."
cat > frontend/.env.production << EOF
VITE_API_URL=https://${VPS_DOMAIN}/api
VITE_APP_NAME=WhizUnik Portal
VITE_APP_VERSION=1.0.0
EOF

# Alternative HTTP fallback
cat > frontend/.env.production.http << EOF
VITE_API_URL=http://${VPS_DOMAIN}:5000/api
VITE_APP_NAME=WhizUnik Portal
VITE_APP_VERSION=1.0.0
EOF

print_status "Environment files created:"
echo "  - .env.production (HTTPS)"
echo "  - .env.production.http (HTTP fallback)"

# Install dependencies
print_status "Installing frontend dependencies..."
cd frontend
npm install

# Build for production
print_status "Building frontend for production..."
npm run build

if [ $? -eq 0 ]; then
    print_status "✅ Build completed successfully!"
    
    # Create .htaccess file for Hostinger
    print_status "Creating .htaccess file..."
    cat > dist/.htaccess << 'EOF'
# WhizUnik Portal - Hostinger Configuration

RewriteEngine On
RewriteBase /

# Handle React Router
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 month"
    ExpiresByType application/font-woff "access plus 1 month"
    ExpiresByType application/font-woff2 "access plus 1 month"
</IfModule>

# Compress files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
EOF

    # Create deployment instructions
    print_status "Creating deployment package..."
    
    # Create a zip file for easy upload
    if command -v zip > /dev/null 2>&1; then
        cd dist
        zip -r ../whizunik-frontend-hostinger.zip . -x "*.DS_Store" "*.git*"
        cd ..
        print_status "📦 Created deployment package: frontend/whizunik-frontend-hostinger.zip"
    fi
    
    echo ""
    echo "🎉 Frontend build completed successfully!"
    echo ""
    print_warning "📋 DEPLOYMENT INSTRUCTIONS FOR HOSTINGER:"
    echo ""
    echo "1. 🌐 LOGIN TO HOSTINGER:"
    echo "   - Go to Hostinger Control Panel"
    echo "   - Select your hosting account"
    echo ""
    echo "2. 📁 ACCESS FILE MANAGER:"
    echo "   - Click on 'File Manager'"
    echo "   - Navigate to 'public_html' folder"
    echo ""
    echo "3. 🗑️ CLEAN EXISTING FILES:"
    echo "   - Delete all existing files in public_html"
    echo "   - Keep only the public_html folder itself"
    echo ""
    echo "4. ⬆️ UPLOAD NEW FILES:"
    echo "   Option A: Upload the zip file and extract"
    echo "   - Upload: frontend/whizunik-frontend-hostinger.zip to public_html"
    echo "   - Extract the zip file in public_html"
    echo "   - Delete the zip file after extraction"
    echo ""
    echo "   Option B: Upload files directly"
    echo "   - Upload ALL contents of frontend/dist/ folder to public_html"
    echo "   - Make sure index.html is in the root of public_html"
    echo ""
    echo "5. ✅ VERIFY DEPLOYMENT:"
    echo "   - Visit https://whizunikhub.com"
    echo "   - Check if the site loads correctly"
    echo ""
    echo "📁 Files to upload are in: $(pwd)/dist/"
    echo ""
    print_warning "⚠️ IMPORTANT NOTES:"
    echo "- Ensure your VPS backend is running at: https://${VPS_DOMAIN}"
    echo "- If using HTTP instead of HTTPS, update frontend/.env.production"
    echo "- Test the site after deployment"
    echo "- Check browser console for any errors"
    
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi