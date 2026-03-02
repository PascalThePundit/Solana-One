const { getDefaultConfig } = require("@expo/metro-config");

/** @type {import('@expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  stream: require.resolve("stream-browserify"),
  path: require.resolve("path-browserify"),
  util: require.resolve("util"),
  process: require.resolve("process"),
  buffer: require.resolve("buffer"),
  fs: require.resolve("path-browserify"), // Use a dummy module or empty mock
};

module.exports = config;
