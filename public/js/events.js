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
  // Mostrar barra de capacidade apenas para admin ou para o organizador dono do evento
  const isOwner = currentUser && currentUser.role === 'organizer' && (
    (event.organizer && event.organizer.id === currentUser.id) || (event.organizer_id && event.organizer_id === currentUser.id)
  );
  const showCapacity = currentUser && (currentUser.role === 'admin' || isOwner);
  const salesBadge = event.sales_closed ? `<span class="sales-closed-badge">Vendas Fechadas</span>` : '';

    const imageUrl = event.image ? event.image : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect fill="%231E40AF" width="400" height="200"/><text fill="white" font-size="24" x="50%" y="50%" text-anchor="middle" dy=".3em">Evento</text></svg>';

    return `
      <div class="event-card" data-event-id="${event.id}">
        <img src="${imageUrl}" alt="${event.title}" class="event-image">
        <div class="event-content">
          <div class="event-badges-container">
            ${salesBadge}
            <span class="event-category">${event.category}</span>
          </div>
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
      const imageUrl = event.image ? event.image : '';

      const currentUser = api.getCurrentUser();
      const isOwner = currentUser && currentUser.role === 'organizer' && (
        (event.organizer && event.organizer.id === currentUser.id) || (event.organizer_id && event.organizer_id === currentUser.id)
      );
      const showCapacity = currentUser && (currentUser.role === 'admin' || isOwner);

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

      // Formatar endereço completo
      const formatFullAddress = (endereco) => {
        if (!endereco) return null;
        const parts = [];
        if (endereco.rua) {
          let street = endereco.rua;
          if (endereco.numero) street += `, ${endereco.numero}`;
          if (endereco.complemento) street += ` - ${endereco.complemento}`;
          parts.push(street);
        }
        if (endereco.bairro) parts.push(endereco.bairro);
        if (endereco.cidade && endereco.estado) {
          parts.push(`${endereco.cidade}/${endereco.estado}`);
        } else if (endereco.cidade) {
          parts.push(endereco.cidade);
        }
        if (endereco.cep) parts.push(`CEP: ${endereco.cep}`);
        return parts.length > 0 ? parts.join(' • ') : null;
      };

      const fullAddress = formatFullAddress(event.endereco);
      
      // HTML do endereço completo
      const addressHtml = fullAddress ? `
        <div class="event-detail-item event-address-full">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span><strong>Endereço:</strong> ${fullAddress}</span>
        </div>
      ` : '';

      const content = `
        ${imageUrl ? `<img src="${imageUrl}" alt="${event.title}" style="width: 100%; height: 250px; object-fit: cover; border-radius: var(--border-radius); margin-bottom: 1.5rem;">` : ''}
        
        <div class="event-badges-container">
          ${salesBadge}
          <span class="event-category">${event.category}</span>
        </div>
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
          ${addressHtml}
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

        <hr />
        <section id="feedbackSection-${event.id}">
          <h4>Avaliações</h4>
          <div id="feedbackList-${event.id}">Carregando avaliações...</div>

          <div id="feedbackFormContainer-${event.id}">
            ${api.isAuthenticated() ? `
              <form id="feedbackForm-${event.id}" class="feedback-form" style="margin-top: 1rem; display: none;">
                <input type="hidden" id="feedbackId-${event.id}" value="">
                <label for="feedbackNota-${event.id}">Nota:</label>
                <select id="feedbackNota-${event.id}" name="nota" required>
                  <option value="">--</option>
                  <option value="5">5 - Excelente</option>
                  <option value="4">4 - Muito bom</option>
                  <option value="3">3 - Bom</option>
                  <option value="2">2 - Ruim</option>
                  <option value="1">1 - Péssimo</option>
                </select>
                <div style="margin-top: .5rem;">
                  <textarea id="feedbackComentario-${event.id}" name="comentario" placeholder="Deixe seu comentário (opcional)" rows="3" style="width:100%;"></textarea>
                </div>
                <div style="margin-top: .5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
                  <button class="btn btn-primary" type="submit">Enviar Avaliação</button>
                  <button class="btn btn-secondary" type="button" id="cancelEditBtn-${event.id}" style="display: none;">Cancelar</button>
                </div>
              </form>
            ` : `<div class="alert alert-info">Faça login para deixar uma avaliação.</div>`}
          </div>
        </section>
      `;

      if (window.authManager) {
        window.authManager.createModal(event.title, content);

        // Após abrir o modal, carregar feedbacks e verificar participação
        (async () => {
          try {
            const listContainer = document.getElementById(`feedbackList-${event.id}`);
            const form = document.getElementById(`feedbackForm-${event.id}`);
            const formContainer = document.getElementById(`feedbackFormContainer-${event.id}`);

            // Verificar se usuário participou do evento
            let isParticipant = false;
            if (api.isAuthenticated()) {
              try {
                const enrollmentsResp = await api.getMyEnrollments();
                const enrollments = enrollmentsResp.data || [];
                isParticipant = enrollments.some(
                  e => e.event_id === event.id && (e.status === 'confirmed' || e.status === 'attended')
                );
              } catch (err) {
                // Erro silencioso - não crítico
              }
            }

            // Mostrar ou ocultar formulário baseado na participação
            if (form) {
              if (isParticipant) {
                form.style.display = 'block';
              } else if (api.isAuthenticated()) {
                formContainer.innerHTML = '<div class="alert alert-info" style="margin-top: 1rem;">Você precisa participar deste evento para deixar uma avaliação.</div>';
              }
            }

            // Carregar feedbacks
            const resp = await api.getFeedbacks(event.id);
            let feedbacks = [];
            if (resp && resp.data) {
              if (Array.isArray(resp.data)) feedbacks = resp.data;
              else if (Array.isArray(resp.data.feedbacks)) feedbacks = resp.data.feedbacks;
            }

            if (!listContainer) return;

            const currentUser = api.getCurrentUser();
            
            const renderFeedbacks = (feedbackList) => {
              // Verificar se usuário já avaliou
              const userFeedback = currentUser ? feedbackList.find(f => f.usuario_id === currentUser.id) : null;
              
              if (feedbackList.length === 0) {
                listContainer.innerHTML = '<p style="color:var(--secondary-color);">Seja o primeiro a avaliar este evento.</p>';
              } else {
                listContainer.innerHTML = feedbackList.map(f => {
                  const date = new Date(f.criado_em || f.createdAt || Date.now());
                  const formatted = date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
                  const isOwner = currentUser && f.usuario_id === currentUser.id;
                  return `
                    <div class="feedback-item">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>${f.user?.name || 'Usuário'}</strong>
                        <small style="color:var(--secondary-color);">${formatted}</small>
                      </div>
                      <div style="margin-top:.25rem;">Nota: <strong>${f.nota}</strong></div>
                      ${f.comentario ? `<p style="margin-top:.5rem; color:var(--secondary-color);">${f.comentario}</p>` : ''}
                      ${isOwner ? `
                        <div class="feedback-actions">
                          <button class="btn-edit" data-feedback-id="${f.id}" data-nota="${f.nota}" data-comentario="${f.comentario || ''}">Editar</button>
                          <button class="btn-delete" data-feedback-id="${f.id}">Excluir</button>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('');
              }

              // Gerenciar visibilidade do formulário baseado em participação + já avaliou
              if (form && isParticipant) {
                if (userFeedback) {
                  // Usuário já avaliou - esconder formulário novo, mas permitir editar
                  form.style.display = 'none';
                  formContainer.querySelector('.alert')?.remove(); // Remover alerts anteriores
                } else {
                  // Usuário pode criar nova avaliação
                  form.style.display = 'block';
                  formContainer.querySelector('.alert')?.remove();
                }
              }

              // Acoplar handlers de editar/excluir
              listContainer.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                  const feedbackId = btn.dataset.feedbackId;
                  const nota = btn.dataset.nota;
                  const comentario = btn.dataset.comentario;
                  
                  if (form) {
                    // Garantir que o formulário esteja visível ao editar
                    form.style.display = 'block';
                    document.getElementById(`feedbackId-${event.id}`).value = feedbackId;
                    document.getElementById(`feedbackNota-${event.id}`).value = nota;
                    document.getElementById(`feedbackComentario-${event.id}`).value = comentario;
                    const cancelBtnEl = document.getElementById(`cancelEditBtn-${event.id}`);
                    if (cancelBtnEl) cancelBtnEl.style.display = 'inline-block';
                    // focar no select de nota para melhor UX
                    const notaEl = document.getElementById(`feedbackNota-${event.id}`);
                    if (notaEl) notaEl.focus();
                    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }
                });
              });

              listContainer.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                  if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;
                  const feedbackId = btn.dataset.feedbackId;
                  try {
                    await api.deleteFeedback(feedbackId);
                    alert('Avaliação excluída com sucesso!');
                    // Recarregar lista
                    const updated = await api.getFeedbacks(event.id);
                    let fb = [];
                    if (updated && updated.data) {
                      if (Array.isArray(updated.data)) fb = updated.data;
                      else if (Array.isArray(updated.data.feedbacks)) fb = updated.data.feedbacks;
                    }
                    renderFeedbacks(fb);
                  } catch (err) {
                    alert('Erro ao excluir avaliação: ' + (err.message || err));
                  }
                });
              });
            };

            renderFeedbacks(feedbacks);

            // Form submit (criar ou editar)
            if (form) {
              const cancelBtn = document.getElementById(`cancelEditBtn-${event.id}`);
              if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                  document.getElementById(`feedbackId-${event.id}`).value = '';
                  document.getElementById(`feedbackNota-${event.id}`).value = '';
                  document.getElementById(`feedbackComentario-${event.id}`).value = '';
                  cancelBtn.style.display = 'none';
                });
              }

              form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const feedbackIdEl = document.getElementById(`feedbackId-${event.id}`);
                const notaEl = document.getElementById(`feedbackNota-${event.id}`);
                const comentarioEl = document.getElementById(`feedbackComentario-${event.id}`);
                const feedbackId = feedbackIdEl.value;
                const nota = notaEl.value;
                const comentario = comentarioEl.value;

                try {
                  if (feedbackId) {
                    // Editar
                    await api.updateFeedback(feedbackId, { nota, comentario });
                    alert('Avaliação atualizada com sucesso!');
                  } else {
                    // Criar
                    await api.createFeedback(event.id, { nota, comentario });
                    alert('Avaliação enviada com sucesso!');
                  }
                  
                  feedbackIdEl.value = '';
                  notaEl.value = '';
                  comentarioEl.value = '';
                  if (cancelBtn) cancelBtn.style.display = 'none';
                  
                  // Recarregar lista
                  const updated = await api.getFeedbacks(event.id);
                  let fb = [];
                  if (updated && updated.data) {
                    if (Array.isArray(updated.data)) fb = updated.data;
                    else if (Array.isArray(updated.data.feedbacks)) fb = updated.data.feedbacks;
                  }
                  renderFeedbacks(fb);
                } catch (err) {
                  alert('Erro ao processar avaliação: ' + (err.message || err));
                }
              });
            }
          } catch (err) {
            console.error('Erro ao carregar feedbacks', err);
            const listContainer = document.getElementById(`feedbackList-${event.id}`);
            if (listContainer) listContainer.innerHTML = '<p style="color:var(--error-color);">Não foi possível carregar avaliações.</p>';
          }
        })();
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
