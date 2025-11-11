// Gerenciamento de Autenticação
class AuthManager {
  constructor() {
    this.init();
  }

  init() {
    this.updateUI();
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Botões de login e registro
    document.getElementById('loginBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showLoginModal();
    });

    document.getElementById('registerBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showRegisterModal();
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.logout();
    });

    // User menu toggle
    document.getElementById('userAvatar')?.addEventListener('click', () => {
      document.getElementById('dropdownMenu')?.classList.toggle('show');
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-menu')) {
        document.getElementById('dropdownMenu')?.classList.remove('show');
      }
    });

    // Links do menu
    document.getElementById('profileLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showProfileModal();
    });

    document.getElementById('myEventsLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/dashboard.html';
    });

    document.getElementById('myEnrollmentsLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showMyEnrollments();
    });

    // Admin link
    document.getElementById('adminLink')?.addEventListener('click', (e) => {
      // se o link estiver presente, leva para /admin.html
      e.preventDefault();
      window.location.href = '/admin.html';
    });
  }

  updateUI() {
    const isAuthenticated = api.isAuthenticated();
    const user = api.getCurrentUser();

    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const createEventBtn = document.getElementById('createEventBtn');

    if (isAuthenticated && user) {
      // Remover completamente os botões de autenticação do DOM quando estiver logado
      if (authButtons && authButtons.parentNode) {
        authButtons.style.display = 'none';
      }
      if (userMenu) {
        userMenu.classList.remove('hidden');
        userMenu.style.display = 'block';
      }

      // Atualizar avatar
      const userName = document.getElementById('userName');
      if (userName) {
        userName.textContent = user.name.charAt(0).toUpperCase();
      }

      // Mostrar link do dashboard para organizadores e admins
      if (user.role === 'organizer' || user.role === 'admin') {
        if (dashboardLink) {
          dashboardLink.classList.remove('hidden');
          dashboardLink.style.display = 'block';
        }
        if (createEventBtn) {
          createEventBtn.style.display = 'inline-flex';
          createEventBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showCreateEventModal();
          });
        }
        // Also show dashboard 'Novo Evento' button if present
        const dashCreateBtn = document.getElementById('btnCreateEvent');
        if (dashCreateBtn) dashCreateBtn.style.display = 'inline-flex';
      } else {
        if (createEventBtn) {
          createEventBtn.style.display = 'none';
        }
        const dashCreateBtn = document.getElementById('btnCreateEvent');
        if (dashCreateBtn) dashCreateBtn.style.display = 'none';
      }

      // Mostrar link do painel admin apenas para admins
      const adminLink = document.getElementById('adminLink');
      if (adminLink) {
        if (user.role === 'admin') {
          adminLink.classList.remove('hidden');
          adminLink.style.display = 'block';
        } else {
          adminLink.classList.add('hidden');
          adminLink.style.display = 'none';
        }
      }
    } else {
      // Restaurar visibilidade dos botões de autenticação quando deslogado
      if (authButtons) {
        authButtons.style.display = '';
        authButtons.classList.remove('hidden');
      }
      if (userMenu) {
        userMenu.classList.add('hidden');
        userMenu.style.display = 'none';
      }
      const adminLink = document.getElementById('adminLink');
      if (adminLink) { adminLink.classList.add('hidden'); adminLink.style.display = 'none'; }
      if (createEventBtn) {
        createEventBtn.style.display = 'none';
      }
      const dashCreateBtn = document.getElementById('btnCreateEvent');
      if (dashCreateBtn) dashCreateBtn.style.display = 'none';
    }
  }

  showLoginModal() {
    const modal = this.createModal('Login', `
      <form id="loginForm">
        <div class="form-group">
          <label for="loginEmail">Email</label>
          <input type="email" id="loginEmail" class="input-field" required>
        </div>
        <div class="form-group">
          <label for="loginPassword">Senha</label>
          <input type="password" id="loginPassword" class="input-field" required>
        </div>
        <div style="text-align: right; margin-bottom: 1rem;">
          <a href="/forgot-password.html" style="color: var(--primary-color); font-size: 0.875rem; text-decoration: none;">Esqueceu sua senha?</a>
        </div>
        <div id="loginError"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Entrar</button>
        </div>
      </form>
      <p style="text-align: center; margin-top: 1rem;">
        Não tem conta? <a href="#" id="switchToRegister" style="color: var(--primary-color); font-weight: 600;">Cadastre-se</a>
      </p>
    `);

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    document.getElementById('switchToRegister').addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
      this.showRegisterModal();
    });
  }

  showRegisterModal() {
    const modal = this.createModal('Cadastrar', `
      <form id="registerForm">
        <div class="form-group">
          <label for="registerName">Nome Completo</label>
          <input type="text" id="registerName" class="input-field" required>
        </div>
        <div class="form-group">
          <label for="registerEmail">Email</label>
          <input type="email" id="registerEmail" class="input-field" required>
        </div>
        <div class="form-group">
          <label for="registerPassword">Senha</label>
          <input type="password" id="registerPassword" class="input-field" minlength="6" required>
        </div>
        <div class="form-group">
          <label for="registerRole">Tipo de Conta</label>
          <select id="registerRole" class="input-field">
            <option value="user">Participante</option>
            <option value="organizer">Organizador</option>
          </select>
        </div>
        <div id="registerError"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Cadastrar</button>
        </div>
      </form>
      <p style="text-align: center; margin-top: 1rem;">
        Já tem conta? <a href="#" id="switchToLogin" style="color: var(--primary-color); font-weight: 600;">Faça login</a>
      </p>
    `);

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegister();
    });

    document.getElementById('switchToLogin').addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
      this.showLoginModal();
    });
  }

  async handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
      const response = await api.login({ email, password });
      errorDiv.innerHTML = '<div class="alert alert-success">Login realizado com sucesso!</div>';
      
      setTimeout(() => {
        closeModal();
        this.updateUI();
        window.location.reload();
      }, 1000);
    } catch (error) {
      errorDiv.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
  }

  async handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const errorDiv = document.getElementById('registerError');

    try {
      const response = await api.register({ name, email, password, role });
      errorDiv.innerHTML = '<div class="alert alert-success">Cadastro realizado com sucesso!</div>';
      
      setTimeout(() => {
        closeModal();
        this.updateUI();
        window.location.reload();
      }, 1000);
    } catch (error) {
      errorDiv.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
  }

  logout() {
    if (confirm('Deseja realmente sair?')) {
      api.clearAuthData();
      this.updateUI();
      window.location.href = '/';
    }
  }

  showProfileModal() {
    const user = api.getCurrentUser();
    const modal = this.createModal('Meu Perfil', `
      <form id="profileForm">
        <div class="form-group">
          <label for="profileName">Nome</label>
          <input type="text" id="profileName" class="input-field" value="${user.name}" required>
        </div>
        <div class="form-group">
          <label for="profileEmail">Email</label>
          <input type="email" id="profileEmail" class="input-field" value="${user.email}" required>
        </div>
        <div id="profileError"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
      <hr style="margin: 2rem 0;">
      <h3 style="margin-bottom: 1rem;">Alterar Senha</h3>
      <form id="passwordForm">
        <div class="form-group">
          <label for="currentPassword">Senha Atual</label>
          <input type="password" id="currentPassword" class="input-field" required>
        </div>
        <div class="form-group">
          <label for="newPassword">Nova Senha</label>
          <input type="password" id="newPassword" class="input-field" minlength="6" required>
        </div>
        <div id="passwordError"></div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Alterar Senha</button>
        </div>
      </form>
    `);

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleUpdateProfile();
    });

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleChangePassword();
    });
  }

  async handleUpdateProfile() {
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const errorDiv = document.getElementById('profileError');

    try {
      const response = await api.updateProfile({ name, email });
      // Atualizar usuário no localStorage
      const user = api.getCurrentUser();
      user.name = name;
      user.email = email;
      localStorage.setItem('user', JSON.stringify(user));
      
      errorDiv.innerHTML = '<div class="alert alert-success">Perfil atualizado com sucesso!</div>';
      setTimeout(() => {
        this.updateUI();
      }, 1000);
    } catch (error) {
      errorDiv.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
  }

  async handleChangePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const errorDiv = document.getElementById('passwordError');

    try {
      await api.changePassword({ currentPassword, newPassword });
      errorDiv.innerHTML = '<div class="alert alert-success">Senha alterada com sucesso!</div>';
      document.getElementById('passwordForm').reset();
    } catch (error) {
      errorDiv.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
  }

  showCreateEventModal() {
    window.location.href = '/dashboard.html';
  }

  async showMyEnrollments() {
    try {
      const response = await api.getMyEnrollments();
      const enrollments = response.data;

      let content = '<div class="enrollments-list">';
      
      if (enrollments.length === 0) {
        content += '<p style="text-align: center; color: var(--secondary-color);">Você ainda não se inscreveu em nenhum evento.</p>';
      } else {
        enrollments.forEach(enrollment => {
          const event = enrollment.event;
          const statusBadge = enrollment.status === 'confirmed' 
            ? '<span style="color: var(--success-color);">✓ Confirmado</span>'
            : '<span style="color: var(--error-color);">✗ Cancelado</span>';
          
          content += `
            <div style="padding: 1rem; background: var(--background-color); border-radius: var(--border-radius); margin-bottom: 1rem;">
              <h4 style="margin-bottom: 0.5rem;">${event.title}</h4>
              <p style="color: var(--secondary-color); font-size: 0.9rem;">
                ${new Date(event.date).toLocaleDateString('pt-BR')} às ${event.time}
              </p>
              <p style="margin-top: 0.5rem;">${statusBadge}</p>
            </div>
          `;
        });
      }
      
      content += '</div>';

      this.createModal('Minhas Inscrições', content);
    } catch (error) {
      alert('Erro ao carregar inscrições: ' + error.message);
    }
  }

  createModal(title, content) {
    const modalHTML = `
      <div class="modal-overlay" onclick="if(event.target === this) closeModal()">
        <div class="modal">
          <div class="modal-header">
            <h2>${title}</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('modalContainer');
    container.innerHTML = modalHTML;
  }
}

// Função global para fechar modal
function closeModal() {
  const container = document.getElementById('modalContainer');
  container.innerHTML = '';
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
});
