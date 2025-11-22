document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('enrollmentsContainer');
  const alerts = document.getElementById('alerts');

  function showAlert(message, type = 'error') {
    alerts.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  }

  // Cria um modal local e retorna funções para manipular
  function createModalLocal(title, bodyHtml) {
    // remover modal anterior se existir
    const existing = document.getElementById('localModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'localModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = 2000;
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close" id="localModalClose">&times;</button>
        </div>
        <div class="modal-body">
          ${bodyHtml}
        </div>
      </div>
    `;

    // fechar ao clicar no X ou fora
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
    document.getElementById('localModalClose').addEventListener('click', () => overlay.remove());
    return overlay;
  }

  // Abre modal com detalhes do evento, seção de feedback e botão de cancelar inscrição
  async function openEventModal(event, enrollment, cardEl) {
    try {
      // obter dados atualizados do evento
      const eventResp = await api.getEvent(event.id);
      const eventData = eventResp.data || event;

      // carregar feedbacks
      const fbResp = await api.getFeedbacks(event.id);
      let feedbacks = [];
      if (Array.isArray(fbResp.data)) feedbacks = fbResp.data;
      else if (Array.isArray(fbResp.data.feedbacks)) feedbacks = fbResp.data.feedbacks;

      const user = api.getCurrentUser();
      const userFeedback = user ? feedbacks.find(f => f.usuario_id === user.id) : null;

      const bodyHtml = `
        <p style="color:var(--secondary-color);">${eventData.description || ''}</p>
        <p><strong>Data:</strong> ${eventData.date ? new Date(eventData.date).toLocaleDateString('pt-BR') : ''} ${eventData.time || ''}</p>
        <p><strong>Local:</strong> ${eventData.location || (eventData.endereco ? eventData.endereco.rua : '')}</p>
        <hr />
        <div id="modalFeedbackSection">
          <h3>Avaliação</h3>
          <div id="modalFeedbackList">Carregando avaliação...</div>
          <div id="modalFeedbackForm" style="margin-top:1rem;">
            <input type="hidden" id="modalFeedbackId" value="${userFeedback ? userFeedback.id : ''}">
            <label for="modalFeedbackNota">Nota:</label>
            <select id="modalFeedbackNota">
              <option value="">Selecione</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <textarea id="modalFeedbackComentario" rows="3" style="width:100%; margin-top:8px;" placeholder="Seu comentário (opcional)">${userFeedback ? (userFeedback.comentario || '') : ''}</textarea>
            <div style="margin-top:8px; display:flex; gap:8px;">
              <button id="modalSaveFeedback" class="btn btn-primary">Salvar avaliação</button>
              <button id="modalDeleteFeedback" class="btn btn-secondary" style="display:${userFeedback ? 'inline-flex' : 'none'}">Excluir avaliação</button>
            </div>
          </div>
        </div>
        <hr />
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
          <button id="modalCloseBtn" class="btn btn-secondary">Fechar</button>
          <button id="modalCancelEnrollmentBtn" class="btn btn-danger">Cancelar Inscrição (Solicitar Reembolso)</button>
        </div>
      `;

      const overlay = createModalLocal(eventData.title || 'Detalhes do Evento', bodyHtml);

      // render feedback list
      const listContainer = document.getElementById('modalFeedbackList');
      const renderFeedbacks = (list) => {
        if (!list || list.length === 0) {
          listContainer.innerHTML = '<p style="color:var(--secondary-color);">Ainda não há avaliações para este evento.</p>';
          return;
        }
        listContainer.innerHTML = list.map(f => `
          <div class="feedback-item">
            <strong>${f.nota} ★</strong>
            <p style="color:var(--secondary-color); margin:6px 0;">${f.comentario || ''}</p>
            <div class="feedback-actions">
              ${user && f.usuario_id === user.id ? `<button class="btn-edit btn btn-outline" data-feedback-id="${f.id}" data-nota="${f.nota}" data-comentario="${(f.comentario||'').replace(/"/g,'\"')}">Editar</button><button class="btn-delete btn btn-secondary" data-feedback-id="${f.id}">Excluir</button>` : ''}
            </div>
          </div>
        `).join('');
      };
      renderFeedbacks(feedbacks);

      // prefill nota
      const notaEl = document.getElementById('modalFeedbackNota');
      const comentarioEl = document.getElementById('modalFeedbackComentario');
      const feedbackIdEl = document.getElementById('modalFeedbackId');
      if (userFeedback) notaEl.value = userFeedback.nota;

      // save handler
      document.getElementById('modalSaveFeedback').addEventListener('click', async () => {
        const nota = notaEl.value;
        const comentario = comentarioEl.value;
        if (!nota) { alert('Escolha uma nota antes de salvar'); return; }
        try {
          if (feedbackIdEl.value) {
            await api.updateFeedback(feedbackIdEl.value, { nota, comentario });
            showAlert('Avaliação atualizada', 'success');
          } else {
            await api.createFeedback(event.id, { nota, comentario });
            showAlert('Avaliação enviada', 'success');
          }
          // reload feedbacks
          const updated = await api.getFeedbacks(event.id);
          let newList = [];
          if (Array.isArray(updated.data)) newList = updated.data; else if (Array.isArray(updated.data.feedbacks)) newList = updated.data.feedbacks;
          renderFeedbacks(newList);
          // show delete button if now exists
          const uf = newList.find(f => user && f.usuario_id === user.id);
          if (uf) { feedbackIdEl.value = uf.id; document.getElementById('modalDeleteFeedback').style.display = 'inline-flex'; }
        } catch (err) {
          console.error('Erro ao salvar feedback', err);
          showAlert('Erro ao salvar avaliação', 'error');
        }
      });

      // delete handler
      document.getElementById('modalDeleteFeedback').addEventListener('click', async () => {
        const fid = feedbackIdEl.value;
        if (!fid) return;
        if (!confirm('Deseja realmente excluir sua avaliação?')) return;
        try {
          await api.deleteFeedback(fid);
          showAlert('Avaliação excluída', 'success');
          const updated = await api.getFeedbacks(event.id);
          let newList = [];
          if (Array.isArray(updated.data)) newList = updated.data; else if (Array.isArray(updated.data.feedbacks)) newList = updated.data.feedbacks;
          renderFeedbacks(newList);
          feedbackIdEl.value = '';
          document.getElementById('modalDeleteFeedback').style.display = 'none';
          notaEl.value = '';
          comentarioEl.value = '';
        } catch (err) {
          console.error('Erro ao deletar feedback', err);
          showAlert('Erro ao excluir avaliação', 'error');
        }
      });

      // cancel enrollment from modal
      document.getElementById('modalCancelEnrollmentBtn').addEventListener('click', async () => {
        if (!confirm('Deseja cancelar sua inscrição e solicitar reembolso?')) return;
        try {
          const resp = await api.cancelEnrollment(event.id);
          showAlert(resp.message || 'Inscrição cancelada', 'success');
          // update card if present
          const mapEntry = window.__enrollmentCardMap && window.__enrollmentCardMap.get(event.id);
          if (mapEntry) {
            mapEntry.status.innerHTML = '<span style="color:var(--error-color)">✗ Cancelado</span>';
            mapEntry.cancelBtn.disabled = true;
          }
          overlay.remove();
        } catch (err) {
          console.error('Erro ao cancelar inscrição', err);
          showAlert(err.message || 'Erro ao cancelar inscrição', 'error');
        }
      });

      // close
      document.getElementById('modalCloseBtn').addEventListener('click', () => overlay.remove());

    } catch (err) {
      console.error('Erro ao abrir modal de evento', err);
      showAlert('Erro ao carregar detalhes do evento', 'error');
    }
  }

  try {
    const res = await api.getMyEnrollments();
    const enrollments = res.data || [];

    if (!enrollments.length) {
      container.innerHTML = '<p class="empty-state">Você ainda não se inscreveu em nenhum evento.</p>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'enrollments-list';

    // Map to keep card references by event id for updates (e.g., after cancel)
    const cardMap = new Map();

    enrollments.forEach(enrollment => {
      const event = enrollment.event || {};

      const card = document.createElement('div');
      card.className = 'enrollment-card';
      card.dataset.eventId = event.id;

      const info = document.createElement('div');
      info.className = 'enrollment-info';
      const title = document.createElement('h3');
      title.textContent = event.title || 'Evento sem título';
      const dateP = document.createElement('p');
      const date = event.date ? new Date(event.date).toLocaleDateString('pt-BR') : '';
      dateP.textContent = date + (event.time ? ' · ' + event.time : '');

      info.appendChild(title);
      info.appendChild(dateP);

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '8px';
      right.style.alignItems = 'center';

      const status = document.createElement('div');
      status.className = 'enrollment-status';
      status.innerHTML = enrollment.status === 'confirmed' ? '<span style="color:var(--success-color)">✓ Confirmado</span>' : '<span style="color:var(--error-color)">✗ Cancelado</span>';

  const viewBtn = document.createElement('button');
  // adicionar classe específica para permitir customizar cor sem afetar outros botões
  viewBtn.className = 'btn btn-outline btn-event-view';
      viewBtn.textContent = 'Ver Evento';
      viewBtn.type = 'button';
      viewBtn.addEventListener('click', () => openEventModal(event, enrollment, card));

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-danger';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancelar Inscrição';
      if (enrollment.status === 'cancelled') {
        cancelBtn.disabled = true;
      }
      cancelBtn.addEventListener('click', async () => {
        const ok = confirm('Deseja realmente cancelar sua inscrição e solicitar reembolso?');
        if (!ok) return;
        try {
          cancelBtn.disabled = true;
          const resp = await api.cancelEnrollment(event.id);
          // Atualiza status visual
          status.innerHTML = '<span style="color:var(--error-color)">✗ Cancelado</span>';
          showAlert(resp.message || 'Inscrição cancelada com sucesso', 'success');
        } catch (err) {
          console.error('Erro ao cancelar inscrição', err);
          showAlert(err.message || 'Erro ao cancelar inscrição', 'error');
          cancelBtn.disabled = false;
        }
      });

      right.appendChild(status);
      right.appendChild(viewBtn);
      right.appendChild(cancelBtn);

      card.appendChild(info);
      card.appendChild(right);

      list.appendChild(card);
      cardMap.set(event.id, { card, status, cancelBtn, enrollment });
    });

    container.innerHTML = '';
    container.appendChild(list);
    // Expose cardMap for modal updates if needed
    window.__enrollmentCardMap = cardMap;
  } catch (err) {
    console.error('Erro ao carregar inscrições:', err);
    showAlert('Erro ao carregar suas inscrições. Tente novamente mais tarde.', 'error');
    container.innerHTML = '<p class="empty-state">Não foi possível carregar suas inscrições.</p>';
  }
});
