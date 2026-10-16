// Metro: the background music track is optional and stays out of the public repository (Suno free plan, not
// redistributable). `ganja-farmer-local-music` resolves to assets/music/local/rasta-rocket-man.mp3 when that
// git-ignored file exists on this machine, and to a module exporting null otherwise (the game then has no music).
const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const LOCAL_MUSIC = path.join(__dirname, 'assets', 'music', 'local', 'rasta-rocket-man.mp3');
const NO_MUSIC = path.join(__dirname, 'src', 'audio', 'noMusic.js');

const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ganja-farmer-local-music') {
    return fs.existsSync(LOCAL_MUSIC) ? { type: 'assetFiles', filePaths: [LOCAL_MUSIC] } : { type: 'sourceFile', filePath: NO_MUSIC };
  }
  return defaultResolve ? defaultResolve(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
