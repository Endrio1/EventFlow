// Script de teste para verificar integração das abas no dashboard

function testDashboardIntegration() {
  console.log('=== Teste de Integração do Dashboard ===');
  
  // Verificar se os elementos das novas abas existem
  const elements = {
    'Aba Reembolsos': document.querySelector('[data-section="refunds"]'),
    'Aba Participantes': document.querySelector('[data-section="participants"]'),
    'Seção Reembolsos': document.getElementById('refunds'),
    'Seção Participantes': document.getElementById('participants'),
    'Container Reembolsos': document.getElementById('refundsContainer'),
    'Container Participantes': document.getElementById('participantsContainer'),
    'Select Event (Participantes)': document.getElementById('selectEvent'),
    'Search Input (Participantes)': document.getElementById('searchInput')
  };
  
  console.log('Elementos encontrados:');
  Object.entries(elements).forEach(([name, element]) => {
    console.log(`${name}: ${element ? '✅ OK' : '❌ NÃO ENCONTRADO'}`);
  });
  
  // Verificar se os scripts estão carregados
  const scripts = {
    'participants.js': typeof window !== 'undefined' && document.querySelector('script[src*="participants.js"]'),
    'refunds.js': typeof window !== 'undefined' && document.querySelector('script[src*="refunds.js"]'),
    'dashboard.js': typeof window !== 'undefined' && document.querySelector('script[src*="dashboard.js"]')
  };
  
  console.log('Scripts carregados:');
  Object.entries(scripts).forEach(([name, loaded]) => {
    console.log(`${name}: ${loaded ? '✅ OK' : '❌ NÃO CARREGADO'}`);
  });
  
  // Testar navegação entre abas
  console.log('Testando navegação...');
  const refundsTab = document.querySelector('[data-section="refunds"]');
  const participantsTab = document.querySelector('[data-section="participants"]');
  
  if (refundsTab && participantsTab) {
    console.log('✅ Abas de navegação encontradas');
    
    // Simular clique na aba reembolsos
    setTimeout(() => {
      refundsTab.click();
      console.log('Clique em Reembolsos simulado');
      
      setTimeout(() => {
        participantsTab.click();
        console.log('Clique em Participantes simulado');
      }, 1000);
    }, 1000);
  } else {
    console.log('❌ Abas de navegação não encontradas');
  }
  
  console.log('=== Fim do Teste ===');
}

// Auto-executar se estamos na página do dashboard
if (typeof window !== 'undefined' && window.location.pathname.includes('dashboard')) {
  // Aguardar o DOM carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(testDashboardIntegration, 2000);
    });
  } else {
    setTimeout(testDashboardIntegration, 2000);
  }
}