
module.exports = function (api) {
  api.cache(true);

  const EDITABLE_COMPONENTS =
    process.env.EXPO_PUBLIC_ENABLE_EDIT_MODE === "TRUE" &&
    process.env.NODE_ENV === "development"
      ? [
          ["./babel-plugins/editable-elements.js", {}],
          ["./babel-plugins/inject-source-location.js", {}],
        ]
      : [];

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [
            ".ios.tsx",
            ".android.tsx",
            ".native.tsx",
            ".web.tsx",
            ".ios.ts",
            ".android.ts",
            ".native.ts",
            ".web.ts",
            ".tsx",
            ".ts",
            ".ios.jsx",
            ".android.jsx",
            ".native.jsx",
            ".web.jsx",
            ".jsx",
            ".ios.js",
            ".android.js",
            ".native.js",
            ".web.js",
            ".js",
            ".mjs",
            ".cjs",
            ".json",
          ],
          alias: {
            "@": "./",
            "@components": "./components",
            "@style": "./style",
            "@hooks": "./hooks",
            "@types": "./types",
            "@contexts": "./contexts",
            "@services": "./services",
            "@utils": "./utils",
            "@data": "./data",
            "@app": "./app",
          },
        },
      ],
      ...EDITABLE_COMPONENTS,
      "@babel/plugin-proposal-export-namespace-from",
      "react-native-worklets/plugin", // react-native-worklets/plugin must be listed last!
    ],
  };
};
