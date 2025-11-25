<<<<<<< HEAD
// Função para carregar os dados de participantes
window.loadParticipantsData = async function() {
  const selectEvent = document.getElementById('selectEvent');
  const participantsContainer = document.getElementById('participantsContainer');
  const searchInput = document.getElementById('searchInput');
  
  if (!selectEvent || !participantsContainer) {
    console.warn('Elementos de participantes não encontrados');
    return;
  }
=======
(async function () {
  const selectEvent = document.getElementById('selectEvent');
  const participantsContainer = document.getElementById('participantsContainer');
  const searchInput = document.getElementById('searchInput');
>>>>>>> parent of 456c26e (Atualização: Melhorias no design)

  function renderParticipants(list) {
    if (!list || list.length === 0) {
      participantsContainer.innerHTML = '<div class="alert alert-info">Nenhum participante encontrado.</div>';
      return;
    }

    let html = '<div class="table-wrapper"><table class="table"><thead><tr><th>Nome</th><th>Email</th><th>Status</th><th>Inscrição</th></tr></thead><tbody>';
    list.forEach(p => {
      const enrollment = p.Enrollment || p.inscricoes || {};
      const name = p.name || p.nome || (p.user && p.user.name) || '—';
      const email = p.email || (p.user && p.user.email) || '—';
      const status = enrollment.status || '—';
      const statusClass = status.toLowerCase();
      const date = enrollment.enrollment_date || enrollment.data_inscricao || enrollment.created_at || enrollment.createdAt || '—';
      const formattedDate = date !== '—' ? new Date(date).toLocaleDateString('pt-BR') : date;
      
      html += `<tr>
        <td data-label="Nome">${name}</td>
        <td data-label="Email">${email}</td>
        <td data-label="Status"><span class="status-badge ${statusClass}">${status}</span></td>
        <td data-label="Inscrição">${formattedDate}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    participantsContainer.innerHTML = html;
  }

  try {
    const resp = await api.getMyEvents();
    const events = (resp.data && (Array.isArray(resp.data) ? resp.data : resp.data.events)) || [];
    
    if (!events.length) {
      selectEvent.innerHTML = '<option value="">Nenhum evento criado ainda</option>';
      participantsContainer.innerHTML = '<div class="alert alert-info">Você ainda não criou nenhum evento.</div>';
      return;
    }

    selectEvent.innerHTML = '<option value="">Selecione um evento...</option>' + 
      events.map(ev => `<option value="${ev.id}">${ev.title} (${ev.date || 'sem data'})</option>`).join('');

    async function loadParticipants() {
      const id = selectEvent.value;
      if (!id) {
        participantsContainer.innerHTML = '';
        return;
      }
      
      participantsContainer.innerHTML = '<div class="alert alert-info">Carregando participantes...</div>';
      
      try {
        const r = await api.getEventParticipants(id);
        const enrollments = (r.data && r.data.enrollments) || r.data || [];
        renderParticipants(enrollments);
      } catch (err) {
        console.error(err);
        participantsContainer.innerHTML = '<div class="alert alert-error">Erro ao buscar participantes.</div>';
      }
    }

    selectEvent.addEventListener('change', () => {
      loadParticipants();
    });

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      const rows = participantsContainer.querySelectorAll('tbody tr');
      if (!rows) return;
      rows.forEach(r => {
        const text = r.textContent.toLowerCase();
        r.style.display = text.includes(q) ? '' : 'none';
      });
    });

    // Não carregar primeiro evento automaticamente - deixar o usuário escolher
  } catch (err) {
    console.error(err);
    participantsContainer.innerHTML = '<div class="alert alert-error">Erro ao carregar eventos. Verifique se você está autenticado como organizador.</div>';
  }
<<<<<<< HEAD
};
=======
})();
>>>>>>> parent of 456c26e (Atualização: Melhorias no design)

