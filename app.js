import { AppState } from './state.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  await UI.init();
});