// Script para a página de Eventos Abertos
document.addEventListener('DOMContentLoaded', async () => {
  const eventsGrid = document.getElementById('eventsGrid');
  const loading = document.getElementById('loading');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const categoryFilter = document.getElementById('categoryFilter');

  let allOpenEvents = []; // Armazena todos os eventos abertos

  // Função para renderizar eventos
  function renderEvents(eventsToRender) {
    if (!eventsGrid) return;

    if (eventsToRender.length === 0) {
      eventsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <h3>Nenhum evento encontrado</h3>
          <p style="color: var(--secondary-color);">Tente ajustar os filtros ou verifique mais tarde.</p>
        </div>
      `;
      return;
    }

    // Reutilizar o gerador de cards existente (eventsManager) quando disponível
    if (window.eventsManager && typeof window.eventsManager.createEventCard === 'function') {
      eventsGrid.innerHTML = eventsToRender.map(e => window.eventsManager.createEventCard(e)).join('');
      // Acoplar listeners (ver detalhes/inscrição)
      window.eventsManager.attachEventCardListeners();
    } else {
      // Fallback simples: render básico
      eventsGrid.innerHTML = eventsToRender.map(e => `
        <div class="event-card" data-event-id="${e.id}">
          <h3>${e.title}</h3>
          <p style="color: var(--secondary-color);">${e.description}</p>
          <a href="/" class="btn btn-primary">Ver Detalhes</a>
        </div>
      `).join('');
    }
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
    }

    renderEvents(filtered);
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

    // Renderizar todos os eventos inicialmente
    renderEvents(allOpenEvents);

  } catch (err) {
    if (loading) loading.style.display = 'none';
    if (eventsGrid) {
      eventsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <h3 style="color: var(--error-color);">Erro ao carregar eventos</h3>
          <p style="color: var(--secondary-color);">${err.message}</p>
        </div>
      `;
    }
  }
});
