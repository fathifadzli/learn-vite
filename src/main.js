import './style.css';
import Alpine from 'alpinejs';

window.Alpine = Alpine;

// Optional: Register Alpine components, stores or directives here
Alpine.store('app', {
  version: '1.0.0',
  theme: 'dark',
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
  }
});

Alpine.start();
