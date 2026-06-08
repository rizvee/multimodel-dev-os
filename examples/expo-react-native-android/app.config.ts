import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env.APP_ENV || 'development';

  const extraConfig = {
    development: {
      apiUrl: 'http://10.0.2.2:3000/api', // Localhost mapping for Android Emulator
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
    extra: {
      ...selectedEnv
    }
  };
};
