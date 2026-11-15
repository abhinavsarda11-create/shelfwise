export const toast = (message, type = 'ok') =>
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, type, id: Date.now() + Math.random() } }));
