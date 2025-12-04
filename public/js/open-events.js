// Script para a página de Eventos Abertos com Carrosséis por Categoria
document.addEventListener('DOMContentLoaded', async () => {
  const eventsContainer = document.getElementById('eventsContainer');
  const eventsGrid = document.getElementById('eventsGrid');
  const loading = document.getElementById('loading');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const categoryFilter = document.getElementById('categoryFilter');

  let allOpenEvents = []; // Armazena todos os eventos abertos

  // Definir categorias disponíveis
  const categoryNames = {
    'tecnologia': 'Tecnologia',
    'negocios': 'Negócios',
    'educacao': 'Educação',
    'saude': 'Saúde',
    'esportes': 'Esportes',
    'cultura': 'Cultura',
    'entretenimento': 'Entretenimento'
  };

  // Cores por categoria para visual mais atraente
  const categoryColors = {
    'tecnologia': '#3B82F6',
    'negocios': '#10B981',
    'educacao': '#8B5CF6',
    'saude': '#EF4444',
    'esportes': '#F59E0B',
    'cultura': '#EC4899',
    'entretenimento': '#06B6D4'
  };

  // Função para criar um card de evento
  function createEventCard(event) {
    if (window.eventsManager && typeof window.eventsManager.createEventCard === 'function') {
      return window.eventsManager.createEventCard(event);
    }

    // Fallback caso eventsManager não esteja disponível
    const date = new Date(event.date);
    const formattedDate = date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short'
    });

    const imageUrl = event.image ? event.image : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect fill="%231E40AF" width="400" height="200"/><text fill="white" font-size="24" x="50%" y="50%" text-anchor="middle" dy=".3em">Evento</text></svg>';

    return `
      <div class="event-card" data-event-id="${event.id}">
        <img src="${imageUrl}" alt="${event.title}" class="event-image">
        <div class="event-content">
          <span class="event-category">${event.category}</span>
          <h3 class="event-title">${event.title}</h3>
          <p class="event-description">${event.description}</p>
          <div class="event-details">
            <span>${formattedDate} às ${event.time}</span>
            <span>${event.location}</span>
          </div>
          <div class="event-actions">
            <button class="btn btn-primary btn-view-event" data-event-id="${event.id}">Ver Detalhes</button>
          </div>
        </div>
      </div>
    `;
  }

  // Função para criar um carrossel de categoria
  function createCategoryCarousel(categoryKey, categoryLabel, events) {
    const color = categoryColors[categoryKey] || '#1E40AF';
    const carouselId = `carousel-${categoryKey}`;
    
    return `
      <div class="category-carousel" data-category="${categoryKey}">
        <div class="carousel-header">
          <div class="carousel-title">
            <span class="carousel-icon" style="background: ${color};">
              ${getCategoryIcon(categoryKey)}
            </span>
            <h3>${categoryLabel}</h3>
            <span class="event-count">${events.length} evento${events.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="carousel-controls">
            <button class="carousel-btn carousel-prev" data-carousel="${carouselId}" aria-label="Anterior">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button class="carousel-btn carousel-next" data-carousel="${carouselId}" aria-label="Próximo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
        <div class="carousel-wrapper">
          <div class="carousel-track" id="${carouselId}">
            ${events.map(e => createEventCard(e)).join('')}
          </div>
        </div>
        <div class="carousel-dots" data-carousel="${carouselId}"></div>
      </div>
    `;
  }

  // Função para obter ícone da categoria
  function getCategoryIcon(category) {
    const icons = {
      'tecnologia': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
      'negocios': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3"/></svg>',
      'educacao': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
      'saude': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      'esportes': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>',
      'cultura': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
      'entretenimento': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>'
    };
    return icons[category] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  }

  // Função para agrupar eventos por categoria
  function groupEventsByCategory(events) {
    const grouped = {};
    events.forEach(event => {
      const cat = event.category.toLowerCase();
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(event);
    });
    return grouped;
  }

  // Função para renderizar carrosséis
  function renderCarousels(events) {
    const container = eventsContainer || eventsGrid;
    if (!container) return;

    if (events.length === 0) {
      container.innerHTML = `
        <div class="no-events-message">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 15s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          <h3>Nenhum evento encontrado</h3>
          <p>Tente ajustar os filtros ou verifique mais tarde.</p>
        </div>
      `;
      return;
    }

    const grouped = groupEventsByCategory(events);
    const categoryOrder = Object.keys(categoryNames);
    
    let html = '';
    
    // Renderizar carrosséis na ordem definida
    categoryOrder.forEach(catKey => {
      if (grouped[catKey] && grouped[catKey].length > 0) {
        const label = categoryNames[catKey] || catKey;
        html += createCategoryCarousel(catKey, label, grouped[catKey]);
      }
    });

    // Adicionar categorias não listadas (caso existam eventos com categorias diferentes)
    Object.keys(grouped).forEach(catKey => {
      if (!categoryOrder.includes(catKey) && grouped[catKey].length > 0) {
        const label = catKey.charAt(0).toUpperCase() + catKey.slice(1);
        html += createCategoryCarousel(catKey, label, grouped[catKey]);
      }
    });

    container.innerHTML = html;

    // Inicializar carrosséis
    initCarousels();
    
    // Acoplar listeners dos cards
    if (window.eventsManager && typeof window.eventsManager.attachEventCardListeners === 'function') {
      window.eventsManager.attachEventCardListeners();
    }
  }

  // Função para renderizar grid tradicional (quando há filtro de categoria)
  function renderGrid(events) {
    const container = eventsContainer || eventsGrid;
    if (!container) return;

    if (events.length === 0) {
      container.innerHTML = `
        <div class="no-events-message">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 15s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          <h3>Nenhum evento encontrado</h3>
          <p>Tente ajustar os filtros ou verifique mais tarde.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="events-grid-filtered">${events.map(e => createEventCard(e)).join('')}</div>`;
    
    if (window.eventsManager && typeof window.eventsManager.attachEventCardListeners === 'function') {
      window.eventsManager.attachEventCardListeners();
    }
  }

  // Função para inicializar os carrosséis
  function initCarousels() {
    document.querySelectorAll('.category-carousel').forEach(carousel => {
      const trackId = carousel.querySelector('.carousel-track').id;
      const track = document.getElementById(trackId);
      const prevBtn = carousel.querySelector('.carousel-prev');
      const nextBtn = carousel.querySelector('.carousel-next');
      const dotsContainer = carousel.querySelector('.carousel-dots');
      
      if (!track) return;

      const cards = track.querySelectorAll('.event-card');
      const cardCount = cards.length;
      
      // Calcular quantos cards mostrar baseado na largura
      const getVisibleCards = () => {
        const width = window.innerWidth;
        if (width < 640) return 1;
        if (width < 900) return 2;
        if (width < 1200) return 3;
        return 4;
      };

      let currentIndex = 0;
      let visibleCards = getVisibleCards();
      let totalPages = Math.ceil(cardCount / visibleCards);

      // Criar dots
      const createDots = () => {
        if (!dotsContainer) return;
        totalPages = Math.ceil(cardCount / visibleCards);
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalPages; i++) {
          const dot = document.createElement('button');
          dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
          dot.setAttribute('aria-label', `Página ${i + 1}`);
          dot.addEventListener('click', () => goToPage(i));
          dotsContainer.appendChild(dot);
        }
      };

      // Atualizar posição do carrossel
      const updateCarousel = () => {
        const cardWidth = cards[0]?.offsetWidth || 320;
        const gap = 24; // gap entre cards
        const offset = currentIndex * (cardWidth + gap);
        track.style.transform = `translateX(-${offset}px)`;
        
        // Atualizar dots
        dotsContainer?.querySelectorAll('.carousel-dot').forEach((dot, i) => {
          const pageIndex = Math.floor(currentIndex / visibleCards);
          dot.classList.toggle('active', i === pageIndex);
        });

        // Atualizar estado dos botões
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= cardCount - visibleCards;
      };

      // Navegação
      const goToPage = (pageIndex) => {
        currentIndex = pageIndex * visibleCards;
        if (currentIndex > cardCount - visibleCards) {
          currentIndex = Math.max(0, cardCount - visibleCards);
        }
        updateCarousel();
      };

      const goNext = () => {
        if (currentIndex < cardCount - visibleCards) {
          currentIndex++;
          updateCarousel();
        }
      };

      const goPrev = () => {
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      };

      // Event listeners
      if (prevBtn) prevBtn.addEventListener('click', goPrev);
      if (nextBtn) nextBtn.addEventListener('click', goNext);

      // Touch/swipe support
      let touchStartX = 0;
      let touchEndX = 0;

      track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) goNext();
          else goPrev();
        }
      }, { passive: true });

      // Resize handler
      const handleResize = () => {
        const newVisibleCards = getVisibleCards();
        if (newVisibleCards !== visibleCards) {
          visibleCards = newVisibleCards;
          currentIndex = 0;
          createDots();
          updateCarousel();
        }
      };

      window.addEventListener('resize', handleResize);

      // Inicializar
      createDots();
      updateCarousel();
    });
  }

  // Função para filtrar eventos
  function filterEvents() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value.toLowerCase() : '';

    let filtered = allOpenEvents;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrar por categoria
    if (selectedCategory) {
      filtered = filtered.filter(event => 
        event.category.toLowerCase() === selectedCategory
      );
      // Quando há filtro de categoria, mostrar grid ao invés de carrosséis
      renderGrid(filtered);
    } else {
      // Sem filtro de categoria, mostrar carrosséis
      renderCarousels(filtered);
    }
  }

  // Event listeners para filtros
  if (searchBtn) {
    searchBtn.addEventListener('click', filterEvents);
  }

  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        filterEvents();
      }
    });
    // Filtrar em tempo real ao digitar (debounce)
    searchInput.addEventListener('input', () => {
      clearTimeout(searchInput.debounceTimer);
      searchInput.debounceTimer = setTimeout(filterEvents, 300);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterEvents);
  }

  // Carregar eventos inicialmente
  try {
    if (loading) loading.style.display = 'block';

    // Buscar muitos eventos
    const resp = await api.getEvents({ page: 1, limit: 100, status: 'active' });
    const events = resp.data.events || [];

    // Filtrar apenas eventos com vendas abertas
    allOpenEvents = events.filter(e => e.status === 'active' && e.sales_closed !== true);

    if (loading) loading.style.display = 'none';

    // Renderizar carrosséis inicialmente
    renderCarousels(allOpenEvents);

  } catch (err) {
    if (loading) loading.style.display = 'none';
    const container = eventsContainer || eventsGrid;
    if (container) {
      container.innerHTML = `
        <div class="no-events-message error">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Erro ao carregar eventos</h3>
          <p>${err.message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
        </div>
      `;
    }
  }
});
