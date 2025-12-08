
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Ensure proper source extensions order - web extensions should come first for web builds
config.resolver.sourceExts = ['tsx', 'ts', 'jsx', 'js', 'mjs', 'cjs', 'json'];

// Ensure proper platform resolution order
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver configuration to handle platform-specific files and ESM modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

module.exports = config;
