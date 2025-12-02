// Script simples para a tela administrativa
document.addEventListener('DOMContentLoaded', () => {
  const usersList = document.getElementById('usersList');
  const eventsList = document.getElementById('eventsList');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const loadEventsBtn = document.getElementById('loadEventsBtn');
  const eventsLimit = document.getElementById('eventsLimit');

  const renderUsers = (users) => {
    if (!users || users.length === 0) return usersList.innerHTML = '<p>Nenhum usuário encontrado</p>';
    usersList.innerHTML = users.map(u => `
      <div class="item">
        <div>
          <strong>${u.nome}</strong> <div class="muted">${u.email} • ${u.papel}</div>
        </div>
        <div style="display:flex; gap:.5rem;">
          <button class="btn btn-danger btn-sm" data-user-id="${u._id}">Deletar</button>
        </div>
      </div>
    `).join('');

    usersList.querySelectorAll('.btn-danger').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
        const id = btn.dataset.userId;
        try {
          await api.deleteUser(id);
          alert('Usuário deletado');
          loadUsers();
        } catch (err) {
          alert('Erro ao deletar usuário: ' + (err.message || err));
        }
      });
    });
  };

  const renderEvents = (events) => {
    if (!events || events.length === 0) return eventsList.innerHTML = '<p>Nenhum evento encontrado</p>';
    eventsList.innerHTML = events.map(ev => `
      <div class="item">
        <div>
          <strong>${ev.title || ev.titulo}</strong>
          <div class="muted">${(ev.organizer && (ev.organizer.nome || ev.organizer.name)) || ''} • ${new Date(ev.date || ev.data).toLocaleString()}</div>
        </div>
        <div style="display:flex; gap:.5rem;">
          <button class="btn btn-primary btn-sm" data-event-id="${ev._id}">Participantes</button>
          <button class="btn btn-danger btn-sm" data-event-id-delete="${ev._id}">Deletar</button>
        </div>
      </div>
    `).join('');

    eventsList.querySelectorAll('[data-event-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.eventId;
        try {
          const resp = await api.getEventParticipants(id);
          const list = resp.data || [];
          alert('Participantes:\n' + list.map(p => `${p.usuario_id?.nome || p.user_id?.name || 'Usuário'} (${p.status})`).join('\n'));
        } catch (err) {
          alert('Erro ao buscar participantes: ' + (err.message || err));
        }
      });
    });

    eventsList.querySelectorAll('[data-event-id-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Deletar este evento? Esta ação não pode ser desfeita.')) return;
        const id = btn.dataset.eventIdDelete;
        try {
          await api.deleteEvent(id);
          alert('Evento deletado');
          loadEvents();
        } catch (err) {
          alert('Erro ao deletar evento: ' + (err.message || err));
        }
      });
    });
  };

  async function loadUsers() {
    usersList.innerHTML = '<p>Carregando...</p>';
    try {
      const q = searchInput.value.trim();
      const resp = await api.getUsers({ q, limit: 50 });
      const users = resp.data?.users || resp.data || [];
      renderUsers(users);
    } catch (err) {
      usersList.innerHTML = '<p>Erro ao carregar usuários</p>';
      console.error(err);
    }
  }

  async function loadEvents() {
    eventsList.innerHTML = '<p>Carregando...</p>';
    try {
      const limit = parseInt(eventsLimit.value || '20');
      const resp = await api.getEvents({ limit });
      const events = resp.data?.events || resp.data || [];
      renderEvents(events);
    } catch (err) {
      eventsList.innerHTML = '<p>Erro ao carregar eventos</p>';
      console.error(err);
    }
  }

  searchBtn.addEventListener('click', () => { loadUsers(); loadEvents(); });
  refreshBtn.addEventListener('click', () => { loadUsers(); loadEvents(); });
  loadEventsBtn.addEventListener('click', () => loadEvents());

  // Inicial
  loadUsers();
  loadEvents();
});
