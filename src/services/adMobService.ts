import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdOptions,
  BannerAdPluginEvents,
} from '@capacitor-community/admob';

export const ADMOB_APP_ID = 'ca-app-pub-4833668827116420~3753425596';
export const ADMOB_BANNER_UNIT_ID = 'ca-app-pub-4833668827116420/8214685836';

class NativeAdMobService {
  private initialized = false;
  private isBannerVisible = false;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.initialized) return;

    try {
      await AdMob.initialize({
        initializeForTesting: false,
      });

      AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        this.isBannerVisible = true;
      });

      AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err) => {
        console.warn('AdMob banner failed to load:', err);
        this.isBannerVisible = false;
      });

      this.initialized = true;
    } catch (e) {
      console.warn('AdMob initialize error:', e);
    }
  }

  async showBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const options: BannerAdOptions = {
        adId: ADMOB_BANNER_UNIT_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: false,
      };

      await AdMob.showBanner(options);
      this.isBannerVisible = true;
    } catch (e) {
      console.warn('AdMob showBanner error:', e);
    }
  }

  async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.isBannerVisible) return;

    try {
      await AdMob.hideBanner();
      this.isBannerVisible = false;
    } catch (e) {
      console.warn('AdMob hideBanner error:', e);
    }
  }

  async resumeBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.resumeBanner();
      this.isBannerVisible = true;
    } catch (e) {
      console.warn('AdMob resumeBanner error:', e);
    }
  }
}

export const adMobService = new NativeAdMobService();
