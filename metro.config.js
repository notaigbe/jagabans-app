
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Ensure proper source extensions order
// For web builds, prioritize .web extensions
// For native builds, prioritize .native, .ios, .android extensions
config.resolver.sourceExts = ['tsx', 'ts', 'jsx', 'js', 'mjs', 'cjs', 'json'];

// Ensure proper platform resolution order
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver configuration to handle platform-specific files and ESM modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

// Block native-only modules from being resolved in web builds
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // If building for web and trying to import Stripe native module, return empty module
  if (platform === 'web' && moduleName === '@stripe/stripe-react-native') {
    return {
      type: 'empty',
    };
  }

  // Use default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
