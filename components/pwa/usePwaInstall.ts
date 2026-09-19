'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwaInstall() {
  const [isInstalled, setIsInstalled] = useState<boolean>(true); // Default true during SSR to prevent flash
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Service Worker ro'yxatdan o'tkazish
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // 2. Ilova allaqachon o'rnatilganligini tekshirish
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('sy_tizim_installed') === 'true';

      setIsInstalled(Boolean(isStandalone));
    };

    checkInstalled();

    // iOS qurilma ekanligini aniqlash
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. 'beforeinstallprompt' hodisasi (Android va Kompyuterlar uchun)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. 'appinstalled' hodisasi (Ilova muvaffaqiyatli yuklab olinganda)
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('sy_tizim_installed', 'true');
      } catch (e) {}
    };

    // 5. Standalone rejimga o'tganda (ekranni o'zgartirganda)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        try {
          localStorage.setItem('sy_tizim_installed', 'true');
        } catch (err) {}
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          try {
            localStorage.setItem('sy_tizim_installed', 'true');
          } catch (e) {}
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install error:', err);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // Brauzer avtomatik prompt bermagan bo'lsa (masalan, brauzer cheklovi)
      setShowIosGuide(true);
    }
  }, [deferredPrompt, isIos]);

  return {
    isInstalled,
    promptInstall,
    showIosGuide,
    setShowIosGuide,
    isIos,
  };
}
