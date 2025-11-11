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
    console.log('Loading users from URL:', url);
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
    const modal = document.getElementById('enrollmentsModal');
    document.getElementById('modalTitle').textContent = 'Inscrições do Evento';
    document.getElementById('modalEventTitle').textContent = `#${eventId} — ${title}`;
    const list = document.getElementById('enrollmentsList');
    list.innerHTML = '<p class="muted">Carregando...</p>';
    modal.style.display = 'flex';

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
    modal.style.display = 'none';
  }

  // Ver detalhes do usuário
  async function viewUserDetails(userId){
    const modal = document.getElementById('enrollmentsModal');
    document.getElementById('modalTitle').textContent = 'Detalhes do Usuário';
    document.getElementById('modalEventTitle').textContent = '';
    const list = document.getElementById('enrollmentsList');
    list.innerHTML = '<p class="muted">Carregando informações do usuário...</p>';
    modal.style.display = 'flex';

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
        <div style="background: #f1f5f9; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea;">
          <h4 style="margin: 0 0 1.25rem 0; color: #1e293b; font-size: 1.125rem;">Informações Completas</h4>
          <div style="display: grid; gap: 1rem;">
            <div style="padding: 0.75rem; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong style="color: #475569; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.5px;">ID</strong><br>
              <span style="color: #0f172a; font-size: 1rem; font-weight: 500;">${user.id}</span>
            </div>
            <div style="padding: 0.75rem; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong style="color: #475569; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.5px;">Nome</strong><br>
              <span style="color: #0f172a; font-size: 1rem; font-weight: 500;">${escapeHtml(user.name || user.fullName || '—')}</span>
            </div>
            <div style="padding: 0.75rem; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong style="color: #475569; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.5px;">Email</strong><br>
              <span style="color: #0f172a; font-size: 1rem; font-weight: 500;">${escapeHtml(user.email || '—')}</span>
            </div>
            <div style="padding: 0.75rem; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong style="color: #475569; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.5px;">Tipo de Conta</strong><br>
              <span class="badge ${roleBadge}">${roleLabel}</span>
            </div>
            <div style="padding: 0.75rem; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong style="color: #475569; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.5px;">Cadastrado em</strong><br>
              <span style="color: #0f172a; font-size: 1rem; font-weight: 500;">${user.createdAt ? new Date(user.createdAt).toLocaleString('pt-BR') : '—'}</span>
            </div>
          </div>
          
          <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid #e2e8f0;">
            <h4 style="margin: 0 0 0.75rem 0; color: #1e293b; font-size: 1rem;">Ações Administrativas</h4>
            <button 
              class="btn-send-reset-password"
              data-user-id="${user.id}"
              data-user-email="${escapeAttr(user.email)}" 
              style="
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
              "
              onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(245, 158, 11, 0.3)';"
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
            >
              🔑 Enviar Link de Redefinição de Senha
            </button>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; color: #64748b; text-align: center;">
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

  document.addEventListener('DOMContentLoaded', ()=>{
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
