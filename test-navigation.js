console.log('=== TESTE NAVEGAÇÃO DASHBOARD ===');

// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM pronto para teste');
    
    // Aguarda um pouco para garantir que tudo foi carregado
    setTimeout(function() {
        console.log('Iniciando teste de navegação...');
        
        // Testar se o dashboardManager existe
        if (typeof dashboardManager !== 'undefined') {
            console.log('Dashboard manager encontrado');
            
            // Testar navegação para refunds
            console.log('Testando navegação para refunds...');
            try {
                dashboardManager.showSection('refunds');
                console.log('✅ Navegação para refunds executada com sucesso');
            } catch (error) {
                console.error('❌ Erro ao navegar para refunds:', error);
            }
            
            // Verificar se a seção está ativa
            setTimeout(function() {
                const refundsSection = document.getElementById('refunds');
                const isActive = refundsSection?.classList.contains('active');
                console.log('Seção refunds ativa:', isActive);
                
                if (!isActive) {
                    console.error('❌ Seção refunds não foi ativada');
                }
            }, 100);
            
        } else {
            console.error('❌ Dashboard manager não encontrado');
        }
    }, 1000);
});