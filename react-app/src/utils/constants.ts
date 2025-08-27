// App constants using environment variables
export const SITE_NAME = import.meta.env.VITE_APP_NAME || 'FutureZXY'
export const SITE_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION || 'Trading Signals Platform'
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'

export const ROUTES = {
  HOME: '/',
  ANALYTICS: '/analytics',
  SIGNALS: '/signals',
  BILLING: '/billing',
  SETTINGS: '/settings',
  AUTH_CALLBACK: '/auth/callback',
}

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.signalstrading.app'

export const API_ENDPOINTS = {
  // Trading endpoints
  PAIRS: '/api/pairs',
  TRADING_SIGNALS: '/api/trading-signal',
  ALERTS: '/api/alerts',
  
  // Payment endpoints
  STRIPE_CHECKOUT: '/api/create-checkout-session',
  STRIPE_WEBHOOK: '/api/webhook',
  
  // Notification endpoints
  NOTIFICATIONS: '/api/notifications',
  PUSH_SUBSCRIBE: '/api/notifications/subscribe',
  
  // Chat and debug
  CHAT: '/api/chat',
  DEBUG_NOTIFICATIONS: '/api/debug/notifications',
}

// Feature flags
export const FEATURES = {
  ANALYTICS_ENABLED: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  NOTIFICATIONS_ENABLED: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  CHAT_ENABLED: import.meta.env.VITE_ENABLE_CHAT === 'true',
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
}

// OneSignal Configuration
export const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || ''

// Environment info
export const IS_PRODUCTION = import.meta.env.PROD
export const IS_DEVELOPMENT = import.meta.env.DEV
