// Utility functions

// Debounce - evita chamadas excessivas de uma função
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export to window for older code that expects a global
window.debounce = debounce;
