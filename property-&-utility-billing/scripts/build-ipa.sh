#!/usr/bin/env bash
set -e

echo "🚀 Starting iOS IPA Build Process..."

# 1. Build Vite web assets
echo "📦 Building web assets with Vite..."
npm run build

# 2. Add or sync Capacitor iOS platform
if [ ! -d "ios" ]; then
  echo "📱 Adding iOS platform via Capacitor..."
  npx cap add ios
fi

echo "🔄 Syncing Capacitor iOS assets..."
npx cap sync ios

# 3. Build Xcode Archive
echo "🔨 Compiling with Xcode..."
cd ios/App

rm -rf build
mkdir -p build

xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$PWD/build/App.xcarchive" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  archive

# 4. Package as .IPA
echo "📦 Packaging .ipa file..."
mkdir -p "$PWD/build/Payload"
cp -r "$PWD/build/App.xcarchive/Products/Applications/App.app" "$PWD/build/Payload/"
cd "$PWD/build"
zip -qr "PropManage.ipa" Payload

echo "✅ SUCCESS! Your iOS IPA file has been built at:"
echo "📁 $(pwd)/PropManage.ipa"
echo "📲 You can now install it on iPhone using Sideloadly, AltStore, TrollStore, or Apple Configurator!"
