/**
 * Omnify Configuration for SSO Client Package
 */

import type { OmnifyConfig } from "@famgia/omnify";
import laravelPlugin from "@famgia/omnify-laravel/plugin";

const config: OmnifyConfig = {
  schemasDir: "./database/schemas",
  plugins: [
    laravelPlugin({
      base: "./",
      modelNamespace: "Omnify\\SsoClient\\Models",
      baseModelNamespace: "Omnify\\SsoClient\\Models\\OmnifyBase",
      modelsPath: "app/Models",
      baseModelsPath: "app/Models/OmnifyBase",
      // Disable resources and requests generation - this package uses custom resources
      // to avoid namespace conflicts (App\Http\Resources vs Omnify\SsoClient\Http\Resources)
      generateResources: false,
      generateRequests: false,
    }),
  ],
  locale: {
    locales: ["ja", "en", "vi"],
    defaultLocale: "ja",
  },
  database: {
    driver: "mysql",
  },
};

export default config;
