#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying CalTrax to Netlify...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local not found. Please run "npm run setup" first.');
  process.exit(1);
}

console.log('✅ Environment file found');

// Check if Netlify CLI is installed
try {
  execSync('netlify --version', { stdio: 'pipe' });
  console.log('✅ Netlify CLI found');
} catch (error) {
  console.log('❌ Netlify CLI not found. Installing...');
  try {
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    console.log('✅ Netlify CLI installed');
  } catch (installError) {
    console.log('❌ Failed to install Netlify CLI. Please install it manually:');
    console.log('   npm install -g netlify-cli');
    process.exit(1);
  }
}

console.log('\n📦 Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful');
} catch (error) {
  console.log('❌ Build failed. Please fix the errors and try again.');
  process.exit(1);
}

console.log('\n🌐 Deploying to Netlify...');
console.log('This will open your browser to complete the deployment.');
console.log('Make sure to:');
console.log('1. Link to your existing Netlify account');
console.log('2. Set up your custom domain (caltrax.ai)');
console.log('3. Add all environment variables from .env.local');

try {
  execSync('netlify deploy --prod --dir=out', { stdio: 'inherit' });
  console.log('\n🎉 Deployment successful!');
  console.log('\n📝 Next steps:');
  console.log('1. Go to your Netlify dashboard');
  console.log('2. Add your environment variables in the site settings');
  console.log('3. Set up your custom domain (caltrax.ai)');
  console.log('4. Test your app!');
} catch (error) {
  console.log('❌ Deployment failed. Please try again.');
  process.exit(1);
}
