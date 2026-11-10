const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// lottie-react-native's web entry imports @lottiefiles/dotlottie-react, which is
// not installed because this app targets iOS/Android only. Stub it out so
// `eas update` (which exports all platforms by default) doesn't fail.
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@lottiefiles/dotlottie-react') {
    return { type: 'empty' };
  }
  return upstream
    ? upstream(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
