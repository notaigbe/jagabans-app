
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Ensure platform-specific extensions are resolved correctly
// Order matters: more specific extensions should come first
config.resolver.sourceExts = ['tsx', 'ts', 'jsx', 'js', 'json'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver configuration to handle platform-specific files
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Ensure proper resolution of platform-specific files
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Let Metro handle the default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
