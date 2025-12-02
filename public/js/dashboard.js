// Dashboard Management
class DashboardManager {
  constructor() {
    this.currentSection = 'overview';
    this.events = [];
    this.editingEventId = null;
    this.activities = [];
    this.editingActivityId = null;
    this.imagesToRemove = []; // Imagens existentes marcadas para remoção
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
    this.attachActivityListeners();
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
        e.preventDefault();
        const section = link.dataset.section;
        this.showSection(section);
      });
    });

    // User menu
    document.getElementById('userAvatar')?.addEventListener('click', () => {
      document.getElementById('dropdownMenu')?.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-right')) {
        document.getElementById('dropdownMenu')?.classList.remove('show');
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

    // Preview de múltiplas imagens
    document.getElementById('eventImages')?.addEventListener('change', (e) => {
      this.previewImages(e.target.files);
    });

    // Definir data mínima para hoje
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
      dateInput.min = today;
    }
  }

  showSection(section) {
    // Atualizar sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.classList.toggle('active', link.dataset.section === section);
    });

    // Atualizar conteúdo
    document.querySelectorAll('.dashboard-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === section);
    });

    this.currentSection = section;

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
    const eventId = event._id || event.id;
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
          <button class="btn btn-primary btn-view-participants" data-event-id="${eventId}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Participantes
          </button>
          <button class="btn btn-secondary btn-edit-event" data-event-id="${eventId}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Editar
          </button>
          <button class="btn btn-danger btn-delete-event" data-event-id="${eventId}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Deletar
          </button>
          ${ (api.getCurrentUser() && (api.getCurrentUser().role === 'admin' || api.getCurrentUser().role === 'organizer')) ? `
          <button class="btn btn-warning btn-toggle-sales" data-event-id="${eventId}" data-closed="${event.sales_closed}">
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
    const event = this.events.find(e => e.id == eventId || e._id == eventId);
    if (!event) return;
    // Abrir seção de criação/edição primeiro (isso chama resetForm),
    // depois preencher os campos e definir editingEventId.
    this.showSection('create');

    this.editingEventId = eventId;
    document.getElementById('formTitle').textContent = 'Editar Evento';

    // Preencher formulário
    document.getElementById('eventId').value = (event._id || event.id);
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventCategory').value = event.category;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventLocation').value = event.location;
    document.getElementById('eventDate').value = event.date.split('T')[0];
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventCapacity').value = event.capacity;

    // Mostrar imagens existentes
    this.imagesToRemove = [];
    this.renderExistingImages(event.images || (event.image ? [event.image] : []));

    // Carregar atividades do evento
    this.loadActivities(eventId);
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

      // Múltiplas imagens
      const imageFiles = document.getElementById('eventImages').files;
      if (imageFiles && imageFiles.length > 0) {
        // Validar quantidade
        const existingImages = this.getExistingImagesCount();
        if (imageFiles.length + existingImages - this.imagesToRemove.length > 5) {
          formError.innerHTML = '<div class="alert alert-error">Máximo de 5 imagens permitidas.</div>';
          return;
        }
        for (let i = 0; i < imageFiles.length; i++) {
          formData.append('images', imageFiles[i]);
        }
      }

      // Imagens a remover (apenas na edição)
      if (this.editingEventId && this.imagesToRemove.length > 0) {
        formData.append('removeImages', JSON.stringify(this.imagesToRemove));
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
    document.getElementById('imagesPreview').innerHTML = '';
    document.getElementById('existingImages').innerHTML = '';
    document.getElementById('formError').innerHTML = '';
    this.editingEventId = null;
    this.imagesToRemove = [];
    
    // Esconder seção de atividades (só aparece na edição)
    const activitiesSection = document.getElementById('activitiesSection');
    if (activitiesSection) {
      activitiesSection.style.display = 'none';
    }
    this.activities = [];
  }

  previewImages(files) {
    const preview = document.getElementById('imagesPreview');
    preview.innerHTML = '';

    if (!files || files.length === 0) return;

    // Validar quantidade total
    const existingCount = this.getExistingImagesCount();
    const totalAfterUpload = files.length + existingCount - this.imagesToRemove.length;
    
    if (totalAfterUpload > 5) {
      alert(`Máximo de 5 imagens. Você tem ${existingCount - this.imagesToRemove.length} existentes e está tentando adicionar ${files.length}.`);
      document.getElementById('eventImages').value = '';
      return;
    }

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.innerHTML = `
          <img src="${e.target.result}" alt="Preview ${index + 1}">
          <span class="image-preview-badge">Nova</span>
        `;
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }

  renderExistingImages(images) {
    const container = document.getElementById('existingImages');
    container.innerHTML = '';

    if (!images || images.length === 0) return;

    container.innerHTML = `
      <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Imagens Atuais (${images.length}/5)</label>
      <div class="existing-images-list">
        ${images.map((img, index) => `
          <div class="existing-image-item" data-image="${img}">
            <img src="http://localhost:3000${img}" alt="Imagem ${index + 1}">
            <button type="button" class="btn-remove-image" data-image="${img}" title="Remover imagem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>
    `;

    // Adicionar listeners para remoção
    container.querySelectorAll('.btn-remove-image').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const imgPath = btn.dataset.image;
        this.toggleImageRemoval(imgPath);
      });
    });
  }

  toggleImageRemoval(imgPath) {
    const item = document.querySelector(`.existing-image-item[data-image="${imgPath}"]`);
    
    if (this.imagesToRemove.includes(imgPath)) {
      // Desmarcar para remoção
      this.imagesToRemove = this.imagesToRemove.filter(i => i !== imgPath);
      item?.classList.remove('marked-for-removal');
    } else {
      // Marcar para remoção
      this.imagesToRemove.push(imgPath);
      item?.classList.add('marked-for-removal');
    }
  }

  getExistingImagesCount() {
    const container = document.getElementById('existingImages');
    return container.querySelectorAll('.existing-image-item').length;
  }

  // ==================== ATIVIDADES ====================

  attachActivityListeners() {
    // Botão adicionar atividade
    document.getElementById('btnAddActivity')?.addEventListener('click', () => {
      this.showActivityModal();
    });

    // Fechar modal de atividade
    document.getElementById('closeActivityModal')?.addEventListener('click', () => {
      this.hideActivityModal();
    });

    document.getElementById('btnCancelActivity')?.addEventListener('click', () => {
      this.hideActivityModal();
    });

    // Fechar modal ao clicar fora
    document.getElementById('activityModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'activityModal') {
        this.hideActivityModal();
      }
    });

    // Formulário de atividade
    document.getElementById('activityForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleActivitySubmit();
    });
  }

  async loadActivities(eventId) {
    const activitiesSection = document.getElementById('activitiesSection');
    const activitiesList = document.getElementById('activitiesList');

    if (!eventId) {
      activitiesSection.style.display = 'none';
      return;
    }

    activitiesSection.style.display = 'block';
    activitiesList.innerHTML = '<p class="text-muted">Carregando atividades...</p>';

    try {
      const response = await api.getEventActivities(eventId);
      this.activities = response.data || [];
      this.renderActivities();
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      activitiesList.innerHTML = `<p class="text-muted">Erro ao carregar atividades: ${error.message}</p>`;
    }
  }

  renderActivities() {
    const activitiesList = document.getElementById('activitiesList');

    if (this.activities.length === 0) {
      activitiesList.innerHTML = `
        <div class="activities-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p>Nenhuma atividade cadastrada para este evento.</p>
          <p>Clique em "Nova Atividade" para adicionar.</p>
        </div>
      `;
      return;
    }

    activitiesList.innerHTML = this.activities.map(activity => this.createActivityItem(activity)).join('');
    this.attachActivityItemListeners();
  }

  createActivityItem(activity) {
    const activityId = activity._id || activity.id;
    const startDate = new Date(activity.start_date || activity.data_inicio);
    const endDate = new Date(activity.end_date || activity.data_fim);

    const formatDateTime = (date) => {
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const location = activity.location || activity.local || '';
    const speaker = activity.speaker || activity.palestrante || '';
    const description = activity.description || activity.descricao || '';
    const title = activity.title || activity.titulo || 'Sem título';

    return `
      <div class="activity-item" data-activity-id="${activityId}">
        <div class="activity-item-header">
          <div>
            <div class="activity-item-title">${title}</div>
          </div>
          <div class="activity-item-actions">
            <button class="btn btn-secondary btn-sm btn-edit-activity" data-activity-id="${activityId}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar
            </button>
            <button class="btn btn-danger btn-sm btn-delete-activity" data-activity-id="${activityId}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Excluir
            </button>
          </div>
        </div>
        <div class="activity-item-meta">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${formatDateTime(startDate)} - ${formatDateTime(endDate)}
          </span>
          ${location ? `
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${location}
          </span>
          ` : ''}
          ${speaker ? `
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            ${speaker}
          </span>
          ` : ''}
        </div>
        ${description ? `<div class="activity-item-description">${description}</div>` : ''}
      </div>
    `;
  }

  attachActivityItemListeners() {
    // Editar atividade
    document.querySelectorAll('.btn-edit-activity').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editActivity(btn.dataset.activityId);
      });
    });

    // Excluir atividade
    document.querySelectorAll('.btn-delete-activity').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.deleteActivity(btn.dataset.activityId);
      });
    });
  }

  showActivityModal(activity = null) {
    const modal = document.getElementById('activityModal');
    const form = document.getElementById('activityForm');
    const title = document.getElementById('activityModalTitle');
    const errorDiv = document.getElementById('activityFormError');

    form.reset();
    errorDiv.innerHTML = '';

    if (activity) {
      // Modo edição
      title.textContent = 'Editar Atividade';
      this.editingActivityId = activity._id || activity.id;
      
      document.getElementById('activityId').value = this.editingActivityId;
      document.getElementById('activityEventId').value = this.editingEventId;
      document.getElementById('activityTitle').value = activity.title || activity.titulo || '';
      document.getElementById('activityDescription').value = activity.description || activity.descricao || '';
      document.getElementById('activityLocation').value = activity.location || activity.local || '';
      document.getElementById('activitySpeaker').value = activity.speaker || activity.palestrante || '';
      document.getElementById('activityCapacity').value = activity.capacity || activity.vagas || '';
      document.getElementById('activityOrder').value = activity.order || activity.ordem || 0;

      // Formatar datas para datetime-local
      const startDate = new Date(activity.start_date || activity.data_inicio);
      const endDate = new Date(activity.end_date || activity.data_fim);
      
      document.getElementById('activityStartDate').value = this.formatDateTimeLocal(startDate);
      document.getElementById('activityEndDate').value = this.formatDateTimeLocal(endDate);
    } else {
      // Modo criação
      title.textContent = 'Nova Atividade';
      this.editingActivityId = null;
      document.getElementById('activityEventId').value = this.editingEventId;
    }

    modal.style.display = 'flex';
  }

  hideActivityModal() {
    const modal = document.getElementById('activityModal');
    modal.style.display = 'none';
    this.editingActivityId = null;
  }

  formatDateTimeLocal(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  async handleActivitySubmit() {
    const errorDiv = document.getElementById('activityFormError');
    errorDiv.innerHTML = '';

    const eventId = this.editingEventId;
    if (!eventId) {
      errorDiv.innerHTML = '<div class="alert alert-error">Evento não encontrado.</div>';
      return;
    }

    const data = {
      title: document.getElementById('activityTitle').value,
      description: document.getElementById('activityDescription').value,
      start_date: new Date(document.getElementById('activityStartDate').value).toISOString(),
      end_date: new Date(document.getElementById('activityEndDate').value).toISOString(),
      location: document.getElementById('activityLocation').value,
      speaker: document.getElementById('activitySpeaker').value,
      order: parseInt(document.getElementById('activityOrder').value) || 0
    };

    const capacity = document.getElementById('activityCapacity').value;
    if (capacity) {
      data.capacity = parseInt(capacity);
    }

    try {
      if (this.editingActivityId) {
        await api.updateActivity(this.editingActivityId, data);
        errorDiv.innerHTML = '<div class="alert alert-success">Atividade atualizada com sucesso!</div>';
      } else {
        await api.createActivity(eventId, data);
        errorDiv.innerHTML = '<div class="alert alert-success">Atividade criada com sucesso!</div>';
      }

      setTimeout(() => {
        this.hideActivityModal();
        this.loadActivities(eventId);
      }, 1000);
    } catch (error) {
      errorDiv.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
  }

  editActivity(activityId) {
    const activity = this.activities.find(a => (a._id || a.id) == activityId);
    if (activity) {
      this.showActivityModal(activity);
    }
  }

  async deleteActivity(activityId) {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) {
      return;
    }

    try {
      await api.deleteActivity(activityId);
      alert('Atividade excluída com sucesso!');
      this.loadActivities(this.editingEventId);
    } catch (error) {
      alert('Erro ao excluir atividade: ' + error.message);
    }
  }
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardManager = new DashboardManager();
});
