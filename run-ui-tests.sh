#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Running UI tests..."

# Set your app's bundle identifier
BUNDLE_ID="dev.skynolimit.traintrack"
SIMULATOR_NAME="iPhone 16 Pro Max"
SIMULATOR_OS="18.5"
SIMULATOR_UDID="C8ECAD0A-62CC-40BB-B01B-D46E50A93EE6"

# Only boot the simulator if not already booted
if ! xcrun simctl list | grep -q 'Booted'; then
  xcrun simctl boot "$SIMULATOR_NAME"
fi

# Grant location permission to your app in the specific simulator
xcrun simctl privacy $SIMULATOR_UDID grant location $BUNDLE_ID

# Build the app and run UI tests using the simulator's name and OS
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme TrainTrackUITests \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=$SIMULATOR_NAME,OS=$SIMULATOR_OS" \
  clean test 