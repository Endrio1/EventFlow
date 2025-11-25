// Dashboard Management
class DashboardManager {
  constructor() {
    this.currentSection = 'overview';
    this.events = [];
    this.editingEventId = null;
    this.init();
  }

  async init() {
    // Verificar autenticação
    if (!api.isAuthenticated()) {
      window.location.href = '/';
      return;
    }

    const user = api.getCurrentUser();
    
    // Verificar permissão
    if (user.role !== 'organizer' && user.role !== 'admin') {
      alert('Você não tem permissão para acessar esta página.');
      window.location.href = '/';
      return;
    }

    this.updateUserInfo();
    this.attachEventListeners();
    this.loadOverview();
  }

  updateUserInfo() {
    const user = api.getCurrentUser();
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userName = document.getElementById('userName');

    if (userNameDisplay) {
      userNameDisplay.textContent = user.name;
    }

    if (userName) {
      userName.textContent = user.name.charAt(0).toUpperCase();
    }
  }

  attachEventListeners() {
    // Navegação da sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const section = link.dataset.section;
        // If the link has a data-section attribute, treat it as an in-page navigation
        if (section) {
          e.preventDefault();
          this.showSection(section);
        } else {
          // Otherwise allow the normal navigation (external/internal href)
          // do not preventDefault so the browser will follow the href
        }
      });
    });

    // User menu
    // Use event.stopPropagation() to avoid the global click handler closing the menu
    const avatarBtn = document.getElementById('userAvatar');
    const dropdown = document.getElementById('dropdownMenu');
    if (avatarBtn) {
      avatarBtn.addEventListener('click', (e) => {
        try {
          e.stopPropagation();
        } catch (err) {
          /* ignore */
        }
        // toggle and log for debugging
        dropdown?.classList.toggle('show');
        // small debug log (remove if not needed)
        // console.log('User avatar clicked, dropdown visible:', dropdown?.classList.contains('show'));
      });
    }

    // Close dropdown when clicking outside nav-right
    document.addEventListener('click', (e) => {
      // if click is outside nav-right, hide dropdown
      if (!e.target.closest || !e.target.closest('.nav-right')) {
        dropdown?.classList.remove('show');
      }
    });

    // Botões
    document.getElementById('btnCreateEvent')?.addEventListener('click', () => {
      this.showCreateForm();
    });

    // Filtros
    document.getElementById('dashboardSearchInput')?.addEventListener('input', 
      debounce(() => this.filterEvents(), 300)
    );

    document.getElementById('dashboardStatusFilter')?.addEventListener('change', () => {
      this.filterEvents();
    });

    // Formulário
    document.getElementById('eventForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleEventSubmit();
    });

    document.getElementById('btnCancelForm')?.addEventListener('click', () => {
      this.showSection('events');
    });

    // Preview de imagem
    document.getElementById('eventImage')?.addEventListener('change', (e) => {
      this.previewImage(e.target.files[0]);
    });

    // Definir data mínima para hoje
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
      dateInput.min = today;
    }
  }

  showSection(section) {
    console.log('showSection chamado com:', section);
    
    // Atualizar sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.classList.toggle('active', link.dataset.section === section);
    });

    // Atualizar conteúdo
    document.querySelectorAll('.dashboard-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === section);
    });

    this.currentSection = section;
    console.log('Seção atual definida como:', this.currentSection);

    // Carregar dados da seção
    switch (section) {
      case 'overview':
        this.loadOverview();
        break;
      case 'events':
        this.loadMyEvents();
        break;
      case 'create':
        this.resetForm();
        break;
<<<<<<< HEAD
      case 'refunds':
        // Carrega os dados de reembolsos
        if (typeof window.loadRefundsData === 'function') {
          window.loadRefundsData();
        }
        break;
      case 'participants':
        // Carrega os dados de participantes
        if (typeof window.loadParticipantsData === 'function') {
          window.loadParticipantsData();
        }
        break;
=======
>>>>>>> parent of 456c26e (Atualização: Melhorias no design)
    }
  }

  async loadOverview() {
    try {
      const response = await api.getMyEvents();
      this.events = response.data;

      // Calcular estatísticas
      const totalEvents = this.events.length;
      const activeEvents = this.events.filter(e => e.status === 'active').length;
      const totalEnrollments = this.events.reduce((sum, e) => sum + e.current_enrollments, 0);
      const upcomingEvents = this.events.filter(e => {
        return e.status === 'active' && new Date(e.date) > new Date();
      }).length;

      // Atualizar stats
      document.getElementById('statTotalEvents').textContent = totalEvents;
      document.getElementById('statActiveEvents').textContent = activeEvents;
      document.getElementById('statTotalEnrollments').textContent = totalEnrollments;
      document.getElementById('statUpcomingEvents').textContent = upcomingEvents;

      // Mostrar eventos recentes
      this.renderRecentEvents();
    } catch (error) {
      console.error('Erro ao carregar visão geral:', error);
    }
  }

  renderRecentEvents() {
    const container = document.getElementById('recentEventsList');
    const recentEvents = this.events.slice(0, 5);

    if (recentEvents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Você ainda não criou nenhum evento.</p>
          <button class="btn btn-primary" onclick="dashboardManager.showSection('create')">
            Criar Primeiro Evento
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = recentEvents.map(event => this.createEventItem(event, true)).join('');
    this.attachEventItemListeners();
  }

  async loadMyEvents() {
    try {
      const response = await api.getMyEvents();
      this.events = response.data;
      this.renderMyEvents();
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      document.getElementById('myEventsList').innerHTML = `
        <div class="empty-state">
          <h3>Erro ao carregar eventos</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  renderMyEvents() {
    const container = document.getElementById('myEventsList');
    let filteredEvents = this.filterEventsList();

    if (filteredEvents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Nenhum evento encontrado</h3>
          <p>Tente ajustar os filtros ou crie um novo evento.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredEvents.map(event => this.createEventItem(event)).join('');
    this.attachEventItemListeners();
  }

  filterEventsList() {
    const search = document.getElementById('dashboardSearchInput')?.value.toLowerCase() || '';
    const status = document.getElementById('dashboardStatusFilter')?.value || '';

    return this.events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(search) ||
                           event.description.toLowerCase().includes(search);
      const matchesStatus = !status || event.status === status;

      return matchesSearch && matchesStatus;
    });
  }

  filterEvents() {
    this.renderMyEvents();
  }

  createEventItem(event, isCompact = false) {
    const date = new Date(event.date);
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const capacityPercentage = (event.current_enrollments / event.capacity) * 100;
    const capacityClass = capacityPercentage >= 100 ? 'full' : capacityPercentage >= 80 ? 'warning' : '';

    const statusLabels = {
      active: 'Ativo',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };

    return `
      <div class="event-item">
        <div class="event-item-header">
          <div class="event-item-title">
            <h3>${event.title}</h3>
            <span class="event-category">${event.category}</span>
          </div>
          <span class="event-status-badge ${event.status}">${statusLabels[event.status]}</span>
        </div>

        ${!isCompact ? `<p style="color: var(--secondary-color); margin-bottom: 1rem;">${event.description}</p>` : ''}

        <div class="event-item-info">
          <div class="event-info-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${formattedDate} às ${event.time}</span>
          </div>
          <div class="event-info-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${event.location}</span>
          </div>
        </div>

        <div class="event-item-capacity">
          <span><strong>${event.current_enrollments}</strong> / ${event.capacity} inscritos</span>
          <div class="capacity-bar" style="flex: 1; margin: 0 1rem;">
            <div class="capacity-fill ${capacityClass}" style="width: ${Math.min(capacityPercentage, 100)}%"></div>
          </div>
          <span>${Math.round(capacityPercentage)}%</span>
        </div>

        <div class="event-item-actions">
          <button class="btn btn-primary btn-view-participants" data-event-id="${event.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Participantes
          </button>
          <button class="btn btn-secondary btn-edit-event" data-event-id="${event.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Editar
          </button>
          <button class="btn btn-danger btn-delete-event" data-event-id="${event.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Deletar
          </button>
          ${ (api.getCurrentUser() && (api.getCurrentUser().role === 'admin' || api.getCurrentUser().role === 'organizer')) ? `
          <button class="btn btn-warning btn-toggle-sales" data-event-id="${event.id}" data-closed="${event.sales_closed}">
            ${event.sales_closed ? 'Reabrir Vendas' : 'Fechar Vendas'}
          </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  attachEventItemListeners() {
    // Ver participantes
    document.querySelectorAll('.btn-view-participants').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.showParticipants(btn.dataset.eventId);
      });
    });

    // Editar
    document.querySelectorAll('.btn-edit-event').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editEvent(btn.dataset.eventId);
      });
    });

    // Deletar
    document.querySelectorAll('.btn-delete-event').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.deleteEvent(btn.dataset.eventId);
      });
    });

    // Toggle sales (admin)
    document.querySelectorAll('.btn-toggle-sales').forEach(btn => {
      btn.addEventListener('click', async () => {
        const eventId = btn.dataset.eventId;
        const closed = btn.dataset.closed === 'true';
        const confirmMsg = closed ? 'Deseja reabrir as vendas deste evento?' : 'Deseja fechar as vendas deste evento?';
        if (!confirm(confirmMsg)) return;

        try {
          await api.setSalesStatus(eventId, !closed);
          alert('Status de vendas atualizado com sucesso');
          this.loadMyEvents();
          this.loadOverview();
        } catch (error) {
          alert('Erro ao atualizar status de vendas: ' + error.message);
        }
      });
    });
  }

  showCreateForm() {
    this.editingEventId = null;
    document.getElementById('formTitle').textContent = 'Criar Novo Evento';
    this.resetForm();
    this.showSection('create');
  }

  editEvent(eventId) {
    const event = this.events.find(e => e.id == eventId);
    if (!event) return;
    // Abrir seção de criação/edição primeiro (isso chama resetForm),
    // depois preencher os campos e definir editingEventId.
    this.showSection('create');

    this.editingEventId = eventId;
    document.getElementById('formTitle').textContent = 'Editar Evento';

    // Preencher formulário
    document.getElementById('eventId').value = event.id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventCategory').value = event.category;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventLocation').value = event.location;
    document.getElementById('eventDate').value = event.date.split('T')[0];
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventCapacity').value = event.capacity;

    // Mostrar preview da imagem atual
    if (event.image) {
      const preview = document.getElementById('imagePreview');
      preview.innerHTML = `<img src="http://localhost:3000${event.image}" alt="Preview">`;
    }
  }

  async handleEventSubmit() {
    const formError = document.getElementById('formError');
    formError.innerHTML = '';

    try {
      const formData = new FormData();
      formData.append('title', document.getElementById('eventTitle').value);
      formData.append('category', document.getElementById('eventCategory').value);
      formData.append('description', document.getElementById('eventDescription').value);
      formData.append('location', document.getElementById('eventLocation').value);
      formData.append('date', document.getElementById('eventDate').value);
      formData.append('time', document.getElementById('eventTime').value);
      formData.append('capacity', document.getElementById('eventCapacity').value);

      const imageFile = document.getElementById('eventImage').files[0];
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // Debug: verificar fluxo (create vs update)
      console.log('[DASHBOARD] submitting event, editingEventId=', this.editingEventId);
      if (this.editingEventId) {
        console.log('[DASHBOARD] calling api.updateEvent with id=', this.editingEventId);
        await api.updateEvent(this.editingEventId, formData);
        formError.innerHTML = '<div class="alert alert-success">Evento atualizado com sucesso!</div>';
      } else {
        console.log('[DASHBOARD] calling api.createEvent');
        await api.createEvent(formData);
        formError.innerHTML = '<div class="alert alert-success">Evento criado com sucesso!</div>';
      }

      setTimeout(() => {
        this.showSection('events');
      }, 1500);
    } catch (error) {
      formError.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
  }

  async deleteEvent(eventId) {
    if (!confirm('Tem certeza que deseja deletar este evento?')) {
      return;
    }

    try {
      await api.deleteEvent(eventId);
      alert('Evento deletado com sucesso!');
      this.loadMyEvents();
      this.loadOverview();
    } catch (error) {
      alert('Erro ao deletar evento: ' + error.message);
    }
  }

  async showParticipants(eventId) {
    try {
      const response = await api.getEventParticipants(eventId);
      const { event, enrollments } = response.data;

      let content = `
        <div style="margin-bottom: 1.5rem;">
          <h3>${event.title}</h3>
          <p style="color: var(--secondary-color);">
            ${event.current_enrollments} / ${event.capacity} participantes
          </p>
        </div>
        <div class="participants-list">
      `;

      if (enrollments.length === 0) {
        content += '<p class="text-center">Ainda não há participantes inscritos.</p>';
      } else {
        enrollments.forEach(enrollment => {
          const statusLabels = {
            confirmed: 'Confirmado',
            cancelled: 'Cancelado',
            attended: 'Compareceu'
          };

          content += `
            <div class="participant-item">
              <div class="participant-info">
                <div class="participant-avatar">
                  ${enrollment.user.name.charAt(0).toUpperCase()}
                </div>
                <div class="participant-details">
                  <h4>${enrollment.user.name}</h4>
                  <p>${enrollment.user.email}</p>
                </div>
              </div>
              <span class="participant-status ${enrollment.status}">
                ${statusLabels[enrollment.status]}
              </span>
            </div>
          `;
        });
      }

      content += '</div>';

      if (window.authManager) {
        window.authManager.createModal('Participantes do Evento', content);
      }
    } catch (error) {
      alert('Erro ao carregar participantes: ' + error.message);
    }
  }

  resetForm() {
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('formError').innerHTML = '';
    this.editingEventId = null;
  }

  previewImage(file) {
    const preview = document.getElementById('imagePreview');

    if (!file) {
      preview.innerHTML = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 300px; border-radius: var(--border-radius); box-shadow: var(--shadow);">`;
    };
    reader.readAsDataURL(file);
  }
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardManager = new DashboardManager();
});
