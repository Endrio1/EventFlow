// Gerenciamento de Eventos
class EventsManager {
  constructor() {
    this.currentPage = 1;
    this.limit = 9;
    this.filters = {
      search: '',
      category: '',
      status: 'active'
    };
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadEvents();
  }

  attachEventListeners() {
    // Busca
    document.getElementById('searchBtn')?.addEventListener('click', () => {
      // Mapear para parâmetro `name` do backend para busca por título
      this.filters.search = document.getElementById('searchInput').value;
      this.filters.name = this.filters.search;
      this.currentPage = 1;
      this.loadEvents();
    });

    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.filters.search = e.target.value;
        this.filters.name = this.filters.search;
        this.currentPage = 1;
        this.loadEvents();
      }
    });

    // Filtro de categoria
    document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
      this.filters.category = e.target.value;
      this.currentPage = 1;
      this.loadEvents();
    });
  }

  async loadEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    const loading = document.getElementById('loading');

    try {
      if (loading) loading.style.display = 'block';

      // Se não existe o container de eventos, aborta silenciosamente
      if (!eventsGrid) return;

      const params = {
        page: this.currentPage,
        limit: this.limit,
        ...this.filters
      };

      const response = await api.getEvents(params);
      const { events, pagination } = response.data;

  if (loading) loading.style.display = 'none';

      if (events.length === 0) {
        eventsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <h3>Nenhum evento encontrado</h3>
            <p style="color: var(--secondary-color);">Tente ajustar os filtros de busca</p>
          </div>
        `;
        return;
      }

      eventsGrid.innerHTML = events.map(event => this.createEventCard(event)).join('');
      this.renderPagination(pagination);
      this.attachEventCardListeners();
    } catch (error) {
  if (loading) loading.style.display = 'none';
      eventsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <h3 style="color: var(--error-color);">Erro ao carregar eventos</h3>
          <p style="color: var(--secondary-color);">${error.message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
        </div>
      `;
    }
  }

  createEventCard(event) {
    const date = new Date(event.date);
    const formattedDate = date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });

  const capacityPercentage = (event.current_enrollments / event.capacity) * 100;
  const capacityClass = capacityPercentage >= 100 ? 'full' : capacityPercentage >= 80 ? 'warning' : '';
  const isFull = event.current_enrollments >= event.capacity;
  const currentUser = api.getCurrentUser();
  const showCapacity = currentUser && (currentUser.role === 'organizer' || currentUser.role === 'admin');
  const salesBadge = event.sales_closed ? `<span class="sales-closed-badge">Vendas Fechadas</span>` : '';

    const imageUrl = event.image ? `http://localhost:3000${event.image}` : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect fill="%231E40AF" width="400" height="200"/><text fill="white" font-size="24" x="50%" y="50%" text-anchor="middle" dy=".3em">Evento</text></svg>';

    return `
      <div class="event-card" data-event-id="${event.id}">
        <img src="${imageUrl}" alt="${event.title}" class="event-image" onerror="this.src='data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 400 200\\"><rect fill=\\"%231E40AF\\" width=\\"400\\" height=\\"200\\"/><text fill=\\"white\\" font-size=\\"24\\" x=\\"50%\\" y=\\"50%\\" text-anchor=\\"middle\\" dy=\\".3em\\">Evento</text></svg>'">
        <div class="event-content">
          ${salesBadge}
          <span class="event-category">${event.category}</span>
          <h3 class="event-title">${event.title}</h3>
          <p class="event-description">${event.description}</p>
          
          <div class="event-details">
            <div class="event-detail-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>${formattedDate} às ${event.time}</span>
            </div>
            <div class="event-detail-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${event.location}</span>
            </div>
          </div>

          ${showCapacity ? `
          <div class="event-capacity">
            <span>${event.current_enrollments}</span>
            <div class="capacity-bar">
              <div class="capacity-fill ${capacityClass}" style="width: ${Math.min(capacityPercentage, 100)}%"></div>
            </div>
            <span>${event.capacity}</span>
          </div>
          ` : ''}

          <div class="event-actions">
            <button class="btn btn-primary btn-view-event" data-event-id="${event.id}">
              Ver Detalhes
            </button>
            ${event.sales_closed ? `
              <button class="btn btn-secondary" disabled>
                Vendas Encerradas
              </button>
            ` : !isFull ? `
              <button class="btn btn-success btn-enroll-event" data-event-id="${event.id}">
                Inscrever-se
              </button>
            ` : `
              <button class="btn btn-secondary" disabled>
                Esgotado
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  attachEventCardListeners() {
    // Ver detalhes
    document.querySelectorAll('.btn-view-event').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const eventId = btn.dataset.eventId;
        await this.showEventDetails(eventId);
      });
    });

    // Inscrever-se
    document.querySelectorAll('.btn-enroll-event').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const eventId = btn.dataset.eventId;
        await this.enrollInEvent(eventId);
      });
    });
  }

  async showEventDetails(eventId) {
    try {
      const response = await api.getEvent(eventId);
      const event = response.data;

      const date = new Date(event.date);
      const formattedDate = date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });

      const isFull = event.current_enrollments >= event.capacity;
      const imageUrl = event.image ? `http://localhost:3000${event.image}` : '';

      const currentUser = api.getCurrentUser();
      const showCapacity = currentUser && (currentUser.role === 'organizer' || currentUser.role === 'admin');

      const salesBadge = event.sales_closed ? `<span class="sales-closed-badge">Vendas Fechadas</span>` : '';

      const capacityHtml = showCapacity ? `
        <div class="event-capacity" style="margin-bottom: 1.5rem;">
          <span><strong>${event.current_enrollments}</strong> inscritos</span>
          <div class="capacity-bar">
            <div class="capacity-fill ${isFull ? 'full' : ''}" style="width: ${(event.current_enrollments / event.capacity) * 100}%"></div>
          </div>
          <span><strong>${event.capacity}</strong> vagas</span>
        </div>
      ` : '';

      const content = `
        ${imageUrl ? `<img src="${imageUrl}" alt="${event.title}" style="width: 100%; height: 250px; object-fit: cover; border-radius: var(--border-radius); margin-bottom: 1.5rem;">` : ''}
        
        ${salesBadge}
        <span class="event-category">${event.category}</span>
        <h3 style="margin: 1rem 0;">${event.title}</h3>
        <p style="color: var(--secondary-color); margin-bottom: 1.5rem;">${event.description}</p>

        <div class="event-details" style="margin-bottom: 1.5rem;">
          <div class="event-detail-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span><strong>Data:</strong> ${formattedDate} às ${event.time}</span>
          </div>
          <div class="event-detail-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span><strong>Local:</strong> ${event.location}</span>
          </div>
          <div class="event-detail-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span><strong>Organizador:</strong> ${event.organizer.name}</span>
          </div>
        </div>

        ${capacityHtml}

        ${api.isAuthenticated() && !isFull && !event.sales_closed ? `
          <button class="btn btn-success btn-large" onclick="eventsManager.enrollInEvent(${event.id}, true)" style="width: 100%;">
            Inscrever-se Agora
          </button>
        ` : isFull ? `
          <div class="alert alert-error">Este evento já atingiu a capacidade máxima.</div>
        ` : event.sales_closed ? `
          <div class="alert alert-info">As vendas para este evento foram encerradas pelo organizador.</div>
        ` : `
          <div class="alert alert-info">Faça login para se inscrever neste evento.</div>
        `}
      `;

      if (window.authManager) {
        window.authManager.createModal(event.title, content);
      }
    } catch (error) {
      alert('Erro ao carregar detalhes do evento: ' + error.message);
    }
  }

  async enrollInEvent(eventId, fromModal = false) {
    if (!api.isAuthenticated()) {
      alert('Você precisa estar logado para se inscrever em um evento.');
      if (window.authManager) {
        window.authManager.showLoginModal();
      }
      return;
    }

    try {
      await api.enrollEvent(eventId);
      alert('Inscrição realizada com sucesso!');
      
      if (fromModal) {
        closeModal();
      }
      
      this.loadEvents();
    } catch (error) {
      alert('Erro ao se inscrever: ' + error.message);
    }
  }

  renderPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    
    if (pagination.totalPages <= 1) {
      paginationDiv.innerHTML = '';
      return;
    }

    let html = '';

    // Botão anterior
    html += `
      <button ${pagination.page === 1 ? 'disabled' : ''} onclick="eventsManager.goToPage(${pagination.page - 1})">
        Anterior
      </button>
    `;

    // Páginas
    for (let i = 1; i <= pagination.totalPages; i++) {
      if (
        i === 1 || 
        i === pagination.totalPages || 
        (i >= pagination.page - 1 && i <= pagination.page + 1)
      ) {
        html += `
          <button class="${i === pagination.page ? 'active' : ''}" onclick="eventsManager.goToPage(${i})">
            ${i}
          </button>
        `;
      } else if (i === pagination.page - 2 || i === pagination.page + 2) {
        html += '<span style="padding: 0.75rem;">...</span>';
      }
    }

    // Botão próximo
    html += `
      <button ${pagination.page === pagination.totalPages ? 'disabled' : ''} onclick="eventsManager.goToPage(${pagination.page + 1})">
        Próximo
      </button>
    `;

    paginationDiv.innerHTML = html;
  }

  goToPage(page) {
    this.currentPage = page;
    this.loadEvents();
    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.eventsManager = new EventsManager();
});
