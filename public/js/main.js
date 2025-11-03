// Funcionalidades gerais do site
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');

  mobileMenuToggle?.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // Smooth scroll para links internos
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href !== '#!') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // Fechar menu mobile após clicar
          navMenu?.classList.remove('active');
        }
      }
    });
  });

  // Atualizar estatísticas
  updateStats();

  // Animação de fade-in para elementos ao rolar
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.event-card, .stat-card, .feature-list li').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
});

// Atualizar estatísticas da página
async function updateStats() {
  try {
    // Buscar eventos para contar
    const response = await api.getEvents({ limit: 1 });
    
    // Atualizar contador de eventos (simulado)
    const totalEvents = response.data.pagination.total;
    animateCounter('totalEvents', totalEvents);
    
    // Simular outros contadores (em produção, viria do backend)
    animateCounter('totalUsers', Math.floor(totalEvents * 15));
    animateCounter('totalEnrollments', Math.floor(totalEvents * 45));
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}

// Animar contadores
function animateCounter(elementId, target) {
  const element = document.getElementById(elementId);
  if (!element) return;

  let current = 0;
  const increment = target / 50;
  const duration = 2000;
  const stepTime = duration / 50;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, stepTime);
}

// Função para formatar data
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

// Função para debounce (otimizar busca)
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

// Validação de formulários
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

// Mostrar notificações toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.zIndex = '10000';
  toast.style.minWidth = '300px';
  toast.style.animation = 'slideInRight 0.3s ease';
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Adicionar animações CSS para toast
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Adicionar listener para fechar modal ao pressionar ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Prevenir scroll quando modal está aberto
const originalOverflow = document.body.style.overflow;
window.addEventListener('DOMNodeInserted', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    document.body.style.overflow = 'hidden';
  }
});

window.addEventListener('DOMNodeRemoved', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    document.body.style.overflow = originalOverflow;
  }
});

// Log de desenvolvimento
if (window.location.hostname === 'localhost') {
  console.log('%cEventFlow', 'color: #1E40AF; font-size: 24px; font-weight: bold;');
  console.log('%cSistema de Gerenciamento de Eventos', 'color: #64748B; font-size: 14px;');
  console.log('%cAmbiente de Desenvolvimento', 'color: #F97316; font-size: 12px;');
}
