/**
 * API Configuration
 * 
 * Automatically detects environment:
 * - Development (localhost) → uses '/api' (same-origin, served by Express)
 * - Production (deployed)   → uses the Render backend URL
 * 
 * DEPLOYMENT INSTRUCTION:
 * Replace the PRODUCTION_API_URL below with your actual Render backend URL.
 * Example: 'https://lost-and-found-backend-xxxx.onrender.com/api'
 */

var API_CONFIG = (function () {
  // ⬇️ GANTI URL INI dengan URL backend Render kamu setelah deploy
  var PRODUCTION_API_URL = 'https://lost-and-found-backend-delta.vercel.app/api';

  var isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

  return {
    API_BASE: isLocalhost ? '/api' : PRODUCTION_API_URL
  };
})();
