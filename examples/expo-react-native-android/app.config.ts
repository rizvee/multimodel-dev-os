import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo App Configuration File
 * Decouples staging/production URLs and binds environment variables at build-time.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env.APP_ENV || 'development';

  const extraConfig = {
    development: {
      apiUrl: 'http://10.0.2.2:3000/api', // Localhost mapping for Android Emulator loopbacks
      envName: 'Development'
    },
    staging: {
      apiUrl: 'https://staging-api.multimodel.dev',
      envName: 'Staging'
    },
    production: {
      apiUrl: 'https://api.multimodel.dev',
      envName: 'Production'
    }
  };

  const selectedEnv = extraConfig[env as keyof typeof extraConfig] || extraConfig.development;

  return {
    ...config,
    name: config.name || "MultiModel Dev OS Mobile",
    slug: config.slug || "multimodel-dev-os-mobile",
    // Configure EAS parameters. Fill these in during local setup. Do not commit actual tokens to Git.
    owner: "your-expo-username-placeholder",
    extra: {
      ...selectedEnv,
      eas: {
        projectId: "your-eas-project-id-placeholder"
      }
    }
  };
};
