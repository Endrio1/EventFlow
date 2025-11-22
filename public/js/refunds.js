(async function () {
  const container = document.getElementById('refundsContainer');

  function renderMessage(msg, type = 'info') {
    container.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  }

  // Se não autenticado, mostrar instrução amigável e abortar
  if (!api.isAuthenticated()) {
    renderMessage('Você precisa estar logado como organizador para ver pedidos de reembolso. Faça login e tente novamente.', 'warning');
    return;
  }

  try {
    const resp = await api.getMyEvents();
    console.debug('DEBUG: getMyEvents response', resp);
    const events = (resp.data && (Array.isArray(resp.data) ? resp.data : resp.data.events)) || [];

    let html = '';

    events.forEach(ev => {
      const refunds = (ev.participants || []).filter(p => {
        if (p.Enrollment && p.Enrollment.status) return p.Enrollment.status === 'cancelled';
        if (p['inscricoes'] && p['inscricoes'].status) return p['inscricoes'].status === 'cancelled';
        return false;
      });

      if (refunds.length === 0) return;

      html += `<div class="refund-card">
        <h2>${ev.title} <small>(${ev.current_enrollments}/${ev.capacity} inscritos)</small></h2>
        <ul class="refund-list">`;

      refunds.forEach(p => {
        const enrollment = p.Enrollment || p.inscricoes || {};
        const name = p.name || p.nome || (p.user && p.user.name) || '—';
        const email = p.email || (p.user && p.user.email) || '—';
        const id = enrollment.id || enrollment.inscricao_id || enrollment.enrollment_id || null;

        html += `<li>
          <div class="refund-user-info">
            <strong>${name}</strong>
            <span>${email}</span>
            <span class="refund-status">Status: ${enrollment.status}</span>
          </div>
          <div class="refund-actions">
            ${id ? `<button class="btn btn-primary btn-refund" data-id="${id}">Marcar como Reembolsado</button>` : '<span class="text-muted">ID ausente</span>'}
          </div>
        </li>`;
      });

      html += `</ul></div>`;
    });

    if (!html) {
      renderMessage('Nenhum pedido de reembolso encontrado. Quando um participante cancelar sua inscrição, aparecerá aqui.', 'info');
    } else {
      container.innerHTML = html;
    }

    // Attach handlers
    document.querySelectorAll('.btn-refund').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        if (!confirm('Marcar esta inscrição como reembolsada? Esta ação não é reversível.')) return;
        try {
          await api.refundEnrollment(id);
          btn.textContent = 'Reembolsado';
          btn.disabled = true;
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-secondary');
        } catch (err) {
          alert(err.message || 'Erro ao marcar reembolso');
        }
      });
    });
  } catch (err) {
    console.error(err);
    renderMessage('Erro ao carregar pedidos de reembolso. Verifique se você está autenticado como organizador.', 'error');
  }
})();