// admin.js - lógica do painel de administração
(function(){
  const apiRoot = '/api';

  function getToken(){
    return localStorage.getItem('token') || '';
  }

  async function fetchJSON(url, opts = {}){
    const headers = opts.headers || {};
    if(getToken()) headers['Authorization'] = 'Bearer ' + getToken();
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    opts.headers = headers;

    const res = await fetch(url, opts);
    if(!res.ok){
      const txt = await res.text();
      throw new Error(`${res.status} ${res.statusText} - ${txt}`);
    }
    return res.status === 204 ? null : res.json();
  }

  // Users
  async function loadUsers(query = ''){
    const q = query ? `?search=${encodeURIComponent(query)}` : '';
    const url = `${apiRoot}/admin/users${q}`;
    try {
      const data = await fetchJSON(url);
      renderUsers(data.data || data || []);
    } catch(err) {
      console.error('Erro ao carregar usuários:', err);
      renderUsers([]);
    }
  }

  function renderUsers(users){
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    if(!users.length){
      tbody.innerHTML = '<tr><td colspan="5" class="muted">Nenhum usuário encontrado</td></tr>';
      return;
    }
    users.forEach(u => {
      const tr = document.createElement('tr');
      const roleBadge = u.role === 'admin' ? 'badge-admin' : u.role === 'organizer' ? 'badge-organizer' : 'badge-user';
      const roleLabel = u.role === 'admin' ? 'Admin' : u.role === 'organizer' ? 'Organizador' : 'Participante';
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${escapeHtml(u.name || u.fullName || '')}</td>
        <td>${escapeHtml(u.email || '')}</td>
        <td><span class="badge ${roleBadge}">${roleLabel}</span></td>
        <td>
          <button class="btn btn-view small-btn" data-action="view" data-id="${u.id}">Ver</button>
          <button class="btn btn-danger small-btn" data-action="delete" data-id="${u.id}">Deletar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Events
  async function loadEvents(query = ''){
    // Adicionar status vazio para mostrar todos os eventos
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    params.append('status', ''); // Remover filtro de status padrão
    params.append('limit', '50'); // Aumentar limite
    
    const url = `${apiRoot}/events?${params.toString()}`;
    try {
      const response = await fetchJSON(url);
      // O endpoint retorna { success: true, data: { events: [...], pagination: {...} } }
      const events = response.data?.events || response.data || response || [];
      renderEvents(events);
    } catch(err) {
      console.error('Erro ao carregar eventos:', err);
      renderEvents([]);
    }
  }

  function renderEvents(events){
    const tbody = document.querySelector('#eventsTable tbody');
    tbody.innerHTML = '';
    if(!events.length){
      tbody.innerHTML = '<tr><td colspan="5" class="muted">Nenhum evento encontrado. Tente criar alguns eventos primeiro!</td></tr>';
      return;
    }
    events.forEach(ev => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ev.id}</td>
        <td>${escapeHtml(ev.title || ev.name || '')}</td>
        <td>${escapeHtml(ev.location || ev.local || '')}</td>
        <td>${ev.capacity != null ? ev.capacity : '—'}</td>
        <td>
          <button class="btn btn-view small-btn" data-action="enrollments" data-id="${ev.id}" data-title="${escapeAttr(ev.title||ev.name||'')}">Inscrições</button>
          <button class="btn btn-danger small-btn" data-action="delete" data-id="${ev.id}">Deletar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Enrollments modal
  async function openEnrollments(eventId, title){
    ensureModalInBody();  // Garantir que modal está no body
    const modal = document.getElementById('enrollmentsModal');
    document.getElementById('modalTitle').textContent = 'Inscrições do Evento';
    document.getElementById('modalEventTitle').textContent = `#${eventId} — ${title}`;
    const list = document.getElementById('enrollmentsList');
    list.innerHTML = '<p class="muted">Carregando...</p>';
    modal.classList.add('show');
    document.body.classList.add('modal-open');

    try{
      // Endpoint correto: /api/enrollments/events/:eventId/participants
      const response = await fetchJSON(`${apiRoot}/enrollments/events/${eventId}/participants`);
      
      if(!response.success || !response.data || !response.data.enrollments || !response.data.enrollments.length){
        list.innerHTML = '<p class="muted">Nenhuma inscrição encontrada para este evento.</p>';
        return;
      }
      
      const enrollments = response.data.enrollments;
      const ul = document.createElement('ul');
      ul.style.listStyle='none';
      ul.style.padding=0;
      
      enrollments.forEach(en => {
        const li = document.createElement('li');
        const user = en.user || en.User || {};
        const statusBadge = en.status === 'confirmed' ? '<span class="badge badge-user">Confirmado</span>' : 
                           en.status === 'cancelled' ? '<span class="badge" style="background: #dc2626;">Cancelado</span>' : 
                           '<span class="badge" style="background: #f59e0b;">Pendente</span>';
        const enrollDate = en.enrollment_date || en.createdAt || en.created_at;
        li.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0.5rem;">
            <div>
              <strong style="color: #0f172a; font-size: 1rem;">${escapeHtml(user.name || user.fullName || '—')}</strong><br>
              <small style="color: #64748b; font-size: 0.875rem;">
                ${escapeHtml(user.email || '—')} • 
                Inscrito em ${enrollDate ? new Date(enrollDate).toLocaleDateString('pt-BR') : '—'}
              </small>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>
        `;
        ul.appendChild(li);
      });
      
      list.innerHTML = '';
      list.appendChild(ul);
    }catch(err){
      console.error('Erro ao carregar inscrições:', err);
      list.innerHTML = `<div class="muted">Erro ao carregar inscrições: ${escapeHtml(err.message)}</div>`;
    }
  }

  function closeModal(){
    const modal = document.getElementById('enrollmentsModal');
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
  
  // Função para garantir que o modal esteja no body e não em outro container
  function ensureModalInBody() {
    const modal = document.getElementById('enrollmentsModal');
    if (modal && modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }
  }

  // Ver detalhes do usuário
  async function viewUserDetails(userId){
    ensureModalInBody();  // Garantir que modal está no body
    const modal = document.getElementById('enrollmentsModal');
    document.getElementById('modalTitle').textContent = 'Detalhes do Usuário';
    document.getElementById('modalEventTitle').textContent = '';
    const list = document.getElementById('enrollmentsList');
    list.innerHTML = '<p class="muted">Carregando informações do usuário...</p>';
    modal.classList.add('show');
    document.body.classList.add('modal-open');

    try {
      // Buscar usuário específico por ID
      const response = await fetchJSON(`${apiRoot}/admin/users/${userId}`);
      
      if (!response.success || !response.data) {
        list.innerHTML = '<p class="muted">Usuário não encontrado.</p>';
        return;
      }

      const user = response.data;
      const roleBadge = user.role === 'admin' ? 'badge-admin' : user.role === 'organizer' ? 'badge-organizer' : 'badge-user';
      const roleLabel = user.role === 'admin' ? 'Administrador' : user.role === 'organizer' ? 'Organizador' : 'Participante';
      
      list.innerHTML = `
        <div class="modal-content">
          <h4 class="modal-section-title">Informações Completas</h4>
          <div class="modal-fields">
            <div class="modal-field">
              <strong class="info-label">ID</strong>
              <span class="info-value">${user.id}</span>
            </div>
            <div class="modal-field">
              <strong class="info-label">Nome</strong>
              <span class="info-value">${escapeHtml(user.name || user.fullName || '—')}</span>
            </div>
            <div class="modal-field">
              <strong class="info-label">Email</strong>
              <span class="info-value">${escapeHtml(user.email || '—')}</span>
            </div>
            <div class="modal-field">
              <strong class="info-label">Tipo de Conta</strong>
              <span class="badge ${roleBadge}">${roleLabel}</span>
            </div>
            <div class="modal-field">
              <strong class="info-label">Cadastrado em</strong>
              <span class="info-value">${user.createdAt ? new Date(user.createdAt).toLocaleString('pt-BR') : '—'}</span>
            </div>
          </div>
          
          <div class="modal-admin-actions">
            <h4 class="modal-section-title">Ações Administrativas</h4>
            <button 
              class="btn-send-reset-password"
              data-user-id="${user.id}"
              data-user-email="${escapeAttr(user.email)}"
            >
              🔑 Enviar Link de Redefinição de Senha
            </button>
            <p class="modal-help-text">
              O usuário receberá um email com instruções para criar uma nova senha
            </p>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Erro ao carregar detalhes do usuário:', err);
      list.innerHTML = `<div class="muted">Erro ao carregar detalhes: ${escapeHtml(err.message)}</div>`;
    }
  }

  // Enviar email de redefinição de senha para usuário
  async function sendPasswordResetEmail(userId, userEmail) {
    if (!confirm(`Confirma o envio de link de redefinição de senha para:\n${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetchJSON(`${apiRoot}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
      });

      if (response.success) {
        alert(`✅ Link de redefinição de senha enviado com sucesso para:\n${userEmail}\n\nO usuário receberá um email com instruções.`);
      } else {
        alert(`❌ Erro ao enviar email:\n${response.message || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Erro ao enviar email de reset:', err);
      alert(`❌ Erro ao enviar email de redefinição:\n${err.message}`);
    }
  }

  // Delete actions
  async function deleteUser(userId){
    if(!confirm('Confirma exclusão do usuário #' + userId + ' ?\nEsta ação não pode ser desfeita.')) return;
    try {
      await fetchJSON(`${apiRoot}/admin/users/${userId}`, { method: 'DELETE' });
      alert('Usuário deletado com sucesso!');
      await loadUsers(document.getElementById('userSearch').value);
    } catch(err) {
      alert('Erro ao deletar usuário: ' + err.message);
    }
  }

  async function deleteEvent(eventId){
    if(!confirm('Confirma exclusão do evento #' + eventId + ' ?\nEsta ação não pode ser desfeita.')) return;
    try {
      await fetchJSON(`${apiRoot}/admin/events/${eventId}`, { method: 'DELETE' });
      alert('Evento deletado com sucesso!');
      await loadEvents(document.getElementById('eventSearch').value);
    } catch(err) {
      alert('Erro ao deletar evento: ' + err.message);
    }
  }

  // Helpers
  function escapeHtml(s){
    if(!s && s !== 0) return '';
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function escapeAttr(s){ return (s||'').replace(/"/g,'\"'); }

  // Event delegation for tables
  function tableClickHandler(e){
    const btn = e.target.closest('button');
    if(!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if(action === 'view'){
      // Abrir modal com detalhes do usuário
      const table = btn.closest('table');
      if(table && table.id === 'usersTable') {
        viewUserDetails(id);
      }
    }else if(action === 'delete'){
      // determine which table
      const table = btn.closest('table');
      if(table && table.id === 'usersTable') deleteUser(id);
      else if(table && table.id === 'eventsTable') deleteEvent(id);
    }else if(action === 'enrollments'){
      openEnrollments(id, btn.dataset.title || 'Evento');
    }
  }

  // (duplicate viewUserDetails removed — using the primary implementation above that includes admin actions)

  // debounce
  function debounce(fn, wait=300){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); }; }

  // Populate admin user info
  function populateAdminInfo() {
    const token = getToken();
    if (!token) {
      window.location.href = '/';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userName = payload.name || 'Admin';
      const userNameDisplay = document.getElementById('adminUserName');
      const avatarSpan = document.getElementById('adminAvatar');
      
      if (userNameDisplay) {
        userNameDisplay.textContent = userName;
      }
      
      if (avatarSpan) {
        avatarSpan.textContent = userName.charAt(0).toUpperCase();
      }
    } catch (err) {
      console.error('Erro ao decodificar token:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // Populate admin info first
    populateAdminInfo();
    
    // initial load
    loadUsers();
    loadEvents();

    // handlers
    document.getElementById('btnSearchUsers').addEventListener('click', ()=> loadUsers(document.getElementById('userSearch').value));
    document.getElementById('btnSearchEvents').addEventListener('click', ()=> loadEvents(document.getElementById('eventSearch').value));
    document.getElementById('usersTable').addEventListener('click', tableClickHandler);
    document.getElementById('eventsTable').addEventListener('click', tableClickHandler);
    document.getElementById('closeModal').addEventListener('click', closeModal);

    // Fechar modal ao clicar fora da modal-card
    const enrollmentsModal = document.getElementById('enrollmentsModal');
    if (enrollmentsModal) {
      enrollmentsModal.addEventListener('click', (e) => {
        // Se o alvo do clique for o overlay (o próprio modal), fecha
        if (e.target === enrollmentsModal) closeModal();
      });
    }

    // Event delegation para botão de redefinição de senha dentro do modal
    document.getElementById('enrollmentsList').addEventListener('click', async (e) => {
      if (e.target.classList.contains('btn-send-reset-password')) {
        const userId = e.target.dataset.userId;
        const userEmail = e.target.dataset.userEmail;
        await sendPasswordResetEmail(userId, userEmail);
      }
    });

    // Fechar modal com tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // quick search on typing
    document.getElementById('userSearch').addEventListener('input', debounce((e)=> loadUsers(e.target.value), 300));
    document.getElementById('eventSearch').addEventListener('input', debounce((e)=> loadEvents(e.target.value), 300));
  });

})();
