import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

export const initializeSkia = async () => {
  try {
    await LoadSkiaWeb({
      locateFile: (file: string) => `/${file}`,
    });
  } catch (error) {
    console.warn("Skia initialization failed for web:", error);
  }
};
