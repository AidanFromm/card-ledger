import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cardledger.app',
  appName: 'CardLedger',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#000000',
    preferredContentMode: 'mobile',
  },
  server: {
    // Allow loading from Supabase
    allowNavigation: ['vbedydaozlvujkpcojct.supabase.co'],
  },
  plugins: {
    Camera: {
      permissions: ['camera'],
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
    BarcodeScanner: {
      formats: ['UPC_A', 'UPC_E', 'EAN_13', 'EAN_8', 'CODE_128'],
    },
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      backgroundColor: '#000000',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
