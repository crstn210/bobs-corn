let container;
function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className =
      'fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none';
    document.body.appendChild(container);
  }
  return container;
}

const VARIANT = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-stone-700',
};

export function toast(message, { variant = 'info', duration = 3500 } = {}) {
  const el = document.createElement('div');
  el.className = `pointer-events-auto rounded-lg px-4 py-3 text-white text-sm shadow-lg max-w-sm transition-opacity duration-200 ${
    VARIANT[variant] || VARIANT.info
  }`;
  el.textContent = message;
  getContainer().appendChild(el);

  const timer = setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }, duration);

  el.addEventListener('click', () => {
    clearTimeout(timer);
    el.remove();
  });
}
