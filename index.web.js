import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

LoadSkiaWeb().then(() => {
  // Once Skia is loaded, we can initialize the rest of the app
  require("expo-router/entry");
});
