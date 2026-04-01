const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// allow CSS imports (required for maplibre-gl)
config.resolver.sourceExts.push('css');

// ensure .web.tsx / .native.tsx platform extensions work
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;