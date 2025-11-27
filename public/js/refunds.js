// Função para carregar os dados de reembolsos
window.loadRefundsData = async function() {
  const container = document.getElementById('refundsContainer');
  if (!container) {
    return;
  }

  function renderMessage(msg, type = 'info') {
    container.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  }

  // Mostrar loading
  container.innerHTML = '<div class="loading-state"><p>Carregando pedidos de reembolso...</p></div>';

  // Se não autenticado, mostrar instrução amigável e abortar
  if (!api.isAuthenticated()) {
    renderMessage('Você precisa estar logado como organizador para ver pedidos de reembolso. Faça login e tente novamente.', 'warning');
    return;
  }

  try {
    const resp = await api.getMyEvents();
    // Handle API errors explicitly
    if (resp && resp.success === false) {
      console.error('API returned error for getMyEvents:', resp);
      renderMessage(resp.message || 'Erro ao obter eventos do organizador', 'error');
      return;
    }
    const events = (resp.data && (Array.isArray(resp.data) ? resp.data : resp.data.events)) || [];

    let html = '';

    events.forEach(ev => {
      const refunds = (ev.participants || []).filter(p => {
        // normalize possible enrollment payloads from different API shapes
        const enrollment = p.Enrollment || p.enrollment || p.Enrollments || p.enrollments || p.inscricoes || p.inscricao || p;
        const status = enrollment && (enrollment.status || enrollment.Status || enrollment.stato);
        return status === 'cancelled' || status === 'cancelled' || status === 'cancelado' || status === 'canceled';
      });

      if (refunds.length === 0) return;

      html += `<div class="refund-card">
        <h2>${ev.title} <small>(${ev.current_enrollments}/${ev.capacity} inscritos)</small></h2>
        <ul class="refund-list">`;

      refunds.forEach(p => {
  const enrollment = p.Enrollment || p.enrollment || p.inscricoes || p.inscricao || p;
  const name = p.name || p.nome || (p.user && p.user.name) || (p.user && p.user.nome) || '—';
  const email = p.email || p.mail || (p.user && (p.user.email || p.user.mail)) || '—';
  const id = enrollment.id || enrollment.inscricao_id || enrollment.enrollment_id || enrollment.EnrollmentId || null;

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
          // refresh the list to reflect changes
          await window.loadRefundsData();
        } catch (err) {
          console.error('Erro ao marcar reembolso:', err);
          alert((err && err.message) || 'Erro ao marcar reembolso');
        }
      });
    });
  } catch (err) {
    console.error(err);
    renderMessage('Erro ao carregar pedidos de reembolso. ' + (err.message || ''), 'error');
  }
};

// Auto-run when loaded as a standalone page (organizer/refunds.html)
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (document.getElementById('refundsContainer')) {
      // call but don't await to avoid blocking
      window.loadRefundsData().catch(err => console.error('Erro loadRefundsData auto-run:', err));
    }
  } catch (e) {
    console.error('Erro ao auto-executar loadRefundsData:', e);
  }
});
