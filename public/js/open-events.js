// Script para a página de Eventos Abertos
document.addEventListener('DOMContentLoaded', async () => {
  const eventsGrid = document.getElementById('eventsGrid');
  const loading = document.getElementById('loading');

  try {
    if (loading) loading.style.display = 'block';

    // Buscar muitos eventos (ajustar limite se necessário)
    const resp = await api.getEvents({ page: 1, limit: 100, status: 'active' });
    const events = resp.data.events || [];

  // Filtrar apenas eventos com vendas abertas (remover eventos cujo sales_closed === true)
  // Também garantir que apenas eventos com status 'active' sejam mostrados
  const openEvents = events.filter(e => e.status === 'active' && e.sales_closed !== true);

    if (loading) loading.style.display = 'none';

    if (!eventsGrid) return;

    if (openEvents.length === 0) {
      eventsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <h3>Nenhum evento com vendas abertas</h3>
          <p style="color: var(--secondary-color);">Verifique mais tarde ou confira outros eventos.</p>
        </div>
      `;
      return;
    }

    // Reutilizar o gerador de cards existente (eventsManager) quando disponível
    if (window.eventsManager && typeof window.eventsManager.createEventCard === 'function') {
      eventsGrid.innerHTML = openEvents.map(e => window.eventsManager.createEventCard(e)).join('');
      // Acoplar listeners (ver detalhes/inscrição)
      window.eventsManager.attachEventCardListeners();
    } else {
      // Fallback simples: render básico
      eventsGrid.innerHTML = openEvents.map(e => `
        <div class="event-card" data-event-id="${e.id}">
          <h3>${e.title}</h3>
          <p style="color: var(--secondary-color);">${e.description}</p>
          <a href="/" class="btn btn-primary">Ver Detalhes</a>
        </div>
      `).join('');
    }
  } catch (err) {
    if (loading) loading.style.display = 'none';
    if (eventsGrid) eventsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <h3 style="color: var(--error-color);">Erro ao carregar eventos</h3>
        <p style="color: var(--secondary-color);">${err.message}</p>
      </div>
    `;
  }
});
