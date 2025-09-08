import './style.css';
import { App } from './app';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.initialize();
});

// Register service worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}