// Script de debug para verificar o problema com a aba de reembolsos

console.log('=== DEBUG REFUNDS TAB ===');

// Verificar se os elementos existem
const refundsLink = document.querySelector('[data-section="refunds"]');
const refundsSection = document.getElementById('refunds');

console.log('Link de reembolsos:', refundsLink);
console.log('Seção de reembolsos:', refundsSection);
console.log('Data-section do link:', refundsLink?.dataset?.section);

// Verificar se há event listeners
const listeners = getEventListeners ? getEventListeners(refundsLink) : 'getEventListeners não disponível';
console.log('Event listeners no link:', listeners);

// Testar navegação manual
if (window.dashboardManager) {
    console.log('Dashboard Manager encontrado');
    console.log('Tentando navegar para refunds...');
    
    try {
        window.dashboardManager.showSection('refunds');
        console.log('Navegação manual executada com sucesso');
    } catch (error) {
        console.error('Erro na navegação manual:', error);
    }
} else {
    console.log('Dashboard Manager não encontrado');
}

// Verificar href do link
console.log('Href do link:', refundsLink?.getAttribute('href'));

// Adicionar event listener de debug
if (refundsLink) {
    refundsLink.addEventListener('click', function(e) {
        console.log('Click capturado no link de reembolsos');
        console.log('Event:', e);
        console.log('Target:', e.target);
        console.log('Current target:', e.currentTarget);
        console.log('Default prevented:', e.defaultPrevented);
    }, true); // true para capturar na fase de captura
}