# scripts/setup.sh
#!/bin/bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo ""
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}============================================${NC}"
    echo ""
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Check if running on supported OS
check_os() {
    print_status "Checking operating system..."
    
    OS="$(uname -s)"
    case "${OS}" in
        Linux*)     MACHINE=Linux;;
        Darwin*)    MACHINE=Mac;;
        CYGWIN*)    MACHINE=Cygwin;;
        MINGW*)     MACHINE=MinGw;;
        MSYS*)      MACHINE=Git;;
        *)          MACHINE="UNKNOWN:${OS}"
    esac
    
    if [[ "$MACHINE" == "UNKNOWN"* ]]; then
        print_error "Unsupported operating system: ${OS}"
        exit 1
    fi
    
    print_success "Running on: ${MACHINE}"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed."
        echo ""
        echo "Please install Node.js 18+ from one of these options:"
        echo "  • Official website: https://nodejs.org/"
        echo "  • Using nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        echo "  • Using brew (macOS): brew install node"
        echo "  • Using apt (Ubuntu): sudo apt install nodejs npm"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        echo ""
        echo "Please upgrade Node.js:"
        echo "  • Visit https://nodejs.org/ for the latest version"
        echo "  • Or use nvm: nvm install 18 && nvm use 18"
        exit 1
    fi
    
    print_success "Node.js $(node --version) found"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm ${NPM_VERSION} found"
}

# Check if git is installed
check_git() {
    print_status "Checking Git installation..."
    
    if ! command -v git &> /dev/null; then
        print_warning "Git is not installed. Some features may not work."
        echo "Install Git from: https://git-scm.com/"
        return 1
    fi
    
    GIT_VERSION=$(git --version)
    print_success "${GIT_VERSION} found"
    return 0
}

# Create necessary directories
create_directories() {
    print_status "Creating project directories..."
    
    directories=(
        "frontend/src/components"
        "frontend/src/utils"
        "frontend/src/types"
        "frontend/src/styles"
        "frontend/public"
        "backend/google-apps-script"
        "backend/deployment"
        "docs"
        "scripts"
        ".github/workflows"
        ".github/ISSUE_TEMPLATE"
        "backups"
        "logs"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        fi
    done
    
    print_success "All directories created"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Check if package.json exists in root
    if [ ! -f "package.json" ]; then
        print_warning "Root package.json not found. Creating basic package.json..."
        cat > package.json << 'EOF'
{
  "name": "nursing-webboard",
  "version": "2.0.0",
  "description": "Secure Educational Webboard System for Nursing Education",
  "private": true,
  "workspaces": ["frontend"],
  "scripts": {
    "install:all": "npm install && cd frontend && npm install",
    "dev": "cd frontend && npm run dev",
    "build": "cd frontend && npm run build",
    "setup:env": "cp .env.example .env.local",
    "clean": "rm -rf node_modules frontend/node_modules frontend/dist"
  },
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^13.2.3"
  }
}
EOF
    fi
    
    # Install root dependencies
    print_step "Installing root dependencies..."
    npm install
    
    # Check if frontend directory exists and has package.json
    if [ ! -f "frontend/package.json" ]; then
        print_status "Creating frontend package.json..."
        cd frontend
        npm init -y
        
        # Install frontend dependencies
        print_step "Installing frontend dependencies..."
        npm install react@^18.2.0 react-dom@^18.2.0 lucide-react@^0.263.1
        npm install --save-dev @types/react@^18.2.15 @types/react-dom@^18.2.7 \
            @vitejs/plugin-react@^4.0.3 vite@^4.4.5 typescript@^5.0.2 \
            tailwindcss@^3.3.0 autoprefixer@^10.4.14 postcss@^8.4.27 \
            eslint@^8.45.0 @typescript-eslint/eslint-plugin@^6.0.0 \
            @typescript-eslint/parser@^6.0.0 prettier@^3.0.0
        
        cd ..
    else
        # Install existing frontend dependencies
        print_step "Installing existing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    print_success "All dependencies installed successfully"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Create .env.example if it doesn't exist
    if [ ! -f ".env.example" ]; then
        print_status "Creating .env.example file..."
        cat > .env.example << 'EOF'
# Nursing Webboard Environment Variables
# คัดลอกไฟล์นี้เป็น .env.local และเติมค่าที่จำเป็น

# Google Sheets Integration (Required)
VITE_GOOGLE_SHEETS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Application Configuration
VITE_APP_ENV=development
VITE_APP_VERSION=2.0.0
VITE_APP_NAME=EduNursing Board
VITE_DEBUG=true

# Optional: External Services
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=your-sentry-dsn

# Feature Flags
FEATURE_OFFLINE_MODE=true
FEATURE_AUTO_BACKUP=true
EOF
    fi
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        print_success "Created .env.local from .env.example"
        print_warning "⚠️  Please edit .env.local with your actual configuration values"
        print_warning "⚠️  Especially update VITE_GOOGLE_SHEETS_API_URL with your Google Apps Script URL"
    else
        print_success ".env.local already exists"
    fi
    
    # Create frontend-specific .env files
    if [ ! -f "frontend/.env.local" ]; then
        ln -sf ../.env.local frontend/.env.local
        print_success "Linked .env.local to frontend directory"
    fi
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    if [ -d ".git" ]; then
        # Install husky hooks
        if command -v npx &> /dev/null; then
            npx husky install
            
            # Create pre-commit hook
            if [ ! -f ".husky/pre-commit" ]; then
                npx husky add .husky/pre-commit "npx lint-staged"
                print_success "Pre-commit hook installed"
            fi
            
            # Create commit-msg hook
            if [ ! -f ".husky/commit-msg" ]; then
                npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'
                print_success "Commit message hook installed"
            fi
            
            print_success "Git hooks installed successfully"
        else
            print_warning "npx not available, skipping Git hooks setup"
        fi
    else
        print_warning "Not a Git repository, skipping Git hooks setup"
        echo "To initialize Git repository, run: git init"
    fi
}

# Create configuration files
create_config_files() {
    print_status "Creating configuration files..."
    
    # Create .gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        print_status "Creating .gitignore file..."
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Temporary folders
tmp/
temp/

# Medical sensitive data
medical-data/
patient-info/
sensitive/

# Backup files
backups/
*.backup
*.bak

# Google Apps Script
.clasp.json
appsscript.json.local

# Cache
.cache/
.parcel-cache/

# Testing
/test-results/
/playwright-report/
/playwright/.cache/
EOF
        print_success "Created .gitignore"
    fi
    
    # Create frontend Vite config
    if [ ! -f "frontend/vite.config.ts" ]; then
        print_status "Creating Vite configuration..."
        cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/nursing-webboard/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
EOF
        print_success "Created Vite configuration"
    fi
    
    # Create Tailwind config
    if [ ! -f "frontend/tailwind.config.js" ]; then
        print_status "Creating Tailwind CSS configuration..."
        cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nursing-red': '#EF4444',
        'nursing-blue': '#3B82F6',
        'medical-green': '#10B981',
      },
      fontFamily: {
        'thai': ['Sarabun', 'Noto Sans Thai', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
EOF
        print_success "Created Tailwind CSS configuration"
    fi
    
    # Create TypeScript config
    if [ ! -f "frontend/tsconfig.json" ]; then
        print_status "Creating TypeScript configuration..."
        cat > frontend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
        print_success "Created TypeScript configuration"
    fi
    
    print_success "All configuration files created"
}

# Verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Check if TypeScript compiles
    if [ -f "frontend/tsconfig.json" ]; then
        print_step "Checking TypeScript compilation..."
        cd frontend
        if npx tsc --noEmit; then
            print_success "TypeScript compilation successful"
        else
            print_warning "TypeScript compilation has issues (this is normal for initial setup)"
        fi
        cd ..
    fi
    
    # Check if build works
    print_step "Testing build process..."
    cd frontend
    if npm run build; then
        print_success "Build process successful"
    else
        print_warning "Build failed - this might be due to missing source files"
    fi
    cd ..
    
    print_success "Verification completed"
}

# Create basic source files
create_basic_files() {
    print_status "Creating basic source files..."
    
    # Create basic index.html
    if [ ! -f "frontend/index.html" ]; then
        cat > frontend/index.html << 'EOF'
<!doctype html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EduNursing Board - ระบบ Webboard การศึกษาพยาบาล</title>
    <meta name="description" content="ระบบ Webboard สำหรับการศึกษาพยาบาล พร้อมระบบความปลอดภัยและการจัดการเนื้อหาทางการแพทย์" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
        print_success "Created index.html"
    fi
    
    # Create basic main.tsx
    if [ ! -f "frontend/src/main.tsx" ]; then
        mkdir -p frontend/src
        cat > frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF
        print_success "Created main.tsx"
    fi
    
    # Create basic App.tsx
    if [ ! -f "frontend/src/App.tsx" ]; then
        cat > frontend/src/App.tsx << 'EOF'
import React from 'react'
import NursingWebboard from './components/NursingWebboard'

function App() {
  return (
    <div className="App">
      <NursingWebboard />
    </div>
  )
}

export default App
EOF
        print_success "Created App.tsx"
    fi
    
    # Create basic CSS
    if [ ! -f "frontend/src/index.css" ]; then
        cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Thai font support */
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

body {
  margin: 0;
  font-family: 'Sarabun', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
EOF
        print_success "Created index.css"
    fi
    
    print_success "Basic source files created"
}

# Display next steps
show_next_steps() {
    print_header "🎉 Setup Completed Successfully!"
    
    echo -e "${GREEN}Your Nursing Webboard project is now ready!${NC}"
    echo ""
    echo -e "${CYAN}📋 Next Steps:${NC}"
    echo ""
    echo -e "${YELLOW}1. 🔧 Configure Google Sheets Backend:${NC}"
    echo "   • Create a Google Sheets document"
    echo "   • Set up Google Apps Script (see docs/backend-setup.md)"
    echo "   • Update VITE_GOOGLE_SHEETS_API_URL in .env.local"
    echo ""
    echo -e "${YELLOW}2. 🚀 Start Development Server:${NC}"
    echo "   npm run dev"
    echo ""
    echo -e "${YELLOW}3. 🌐 Open Your Browser:${NC}"
    echo "   http://localhost:5173"
    echo ""
    echo -e "${YELLOW}4. 🧪 Test the Application:${NC}"
    echo "   • Username: admin"
    echo "   • Password: anything"
    echo "   • 2FA Code: 123456"
    echo ""
    echo -e "${CYAN}📚 Useful Commands:${NC}"
    echo "   npm run dev          # Start development server"
    echo "   npm run build        # Build for production"
    echo "   npm run setup:env    # Reset environment variables"
    echo "   npm run clean        # Clean all dependencies"
    echo ""
    echo -e "${CYAN}📖 Documentation:${NC}"
    echo "   • README.md          # Project overview"
    echo "   • SECURITY.md        # Security guidelines"
    echo "   • docs/              # Detailed documentation"
    echo ""
    echo -e "${CYAN}🆘 Need Help?${NC}"
    echo "   • GitHub Issues: https://github.com/YOUR_USERNAME/nursing-webboard/issues"
    echo "   • Documentation: ./docs/"
    echo ""
    echo -e "${GREEN}🏥 Happy coding with your Nursing Webboard! 🚀${NC}"
    echo ""
}

# Main setup function
main() {
    print_header "🏥 Nursing Webboard Setup"
    
    echo "This script will set up your Nursing Webboard development environment."
    echo "It will install dependencies, create configuration files, and prepare your project."
    echo ""
    
    # Ask for confirmation
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    print_header "🔍 System Check"
    check_os
    check_node
    check_npm
    check_git
    
    print_header "📁 Project Structure"
    create_directories
    
    print_header "📦 Dependencies"
    install_dependencies
    
    print_header "⚙️ Configuration"
    setup_environment
    create_config_files
    create_basic_files
    
    print_header "🔧 Git Setup"
    setup_git_hooks
    
    print_header "✅ Verification"
    verify_installation
    
    show_next_steps
}

# Run main function
main "$@"
