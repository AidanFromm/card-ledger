import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cardledger.app',
  appName: 'CardLedger',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    BarcodeScanner: {
      formats: ['UPC_A', 'UPC_E', 'EAN_13', 'EAN_8', 'CODE_128']
    }
  }
};

export default config;
