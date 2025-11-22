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
        <div class="form-group" id="registerPhoneGroup" style="display:none;">
          <label for="registerPhone">Contato (Telefone)</label>
          <input type="tel" id="registerPhone" class="input-field" placeholder="(99) 99999-9999">
        </div>
        <div class="form-group" id="registerCpfCnpjGroup" style="display:none;">
          <label for="registerCpfCnpj">CPF / CNPJ</label>
          <input type="text" id="registerCpfCnpj" class="input-field" placeholder="Somente números">
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

    // Mostrar/ocultar campos de contato e CPF/CNPJ conforme o tipo de conta
    const roleSelect = document.getElementById('registerRole');
    const phoneGroup = document.getElementById('registerPhoneGroup');
    const cpfGroup = document.getElementById('registerCpfCnpjGroup');
    const phoneInput = document.getElementById('registerPhone');
    const cpfInput = document.getElementById('registerCpfCnpj');

    function toggleRegisterExtras(){
      const role = roleSelect.value;
      // Mostrar os campos para ambos os tipos — participantes devem informar CPF (não CNPJ)
      phoneGroup.style.display = '';
      cpfGroup.style.display = '';
      phoneInput.required = true;
      cpfInput.required = true;

      // Ajustar label para deixar claro o que o usuário deve inserir
      const cpfLabel = document.querySelector('label[for="registerCpfCnpj"]');
      if (cpfLabel) {
        if (role === 'organizer') cpfLabel.textContent = 'CPF / CNPJ';
        else cpfLabel.textContent = 'CPF (participante)';
      }
    }

    roleSelect.addEventListener('change', toggleRegisterExtras);
    // initialize visibility
    toggleRegisterExtras();

    // --- Máscara e comportamento do campo CPF / CNPJ ---
    const onlyDigits = v => (v || '').toString().replace(/\D/g, '');

    const formatCPF = (d) => {
      d = d.slice(0, 11);
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
      if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
      return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
    };

    const formatCNPJ = (d) => {
      d = d.slice(0, 14);
      if (d.length <= 2) return d;
      if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
      if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
      if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
      return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
    };

    function applyCpfCnpjMask() {
      if (!cpfInput) return;
      const role = roleSelect.value;
      const digits = onlyDigits(cpfInput.value);

      if (role === 'user') {
        // For participants, force CPF behavior (max 11 digits)
        cpfInput.value = formatCPF(digits);
        cpfInput.dataset.maxDigits = '11';
        cpfInput.setAttribute('inputmode', 'numeric');
      } else {
        // Organizers: accept CPF (<=11) or CNPJ (>11)
        if (digits.length <= 11) {
          cpfInput.value = formatCPF(digits);
        } else {
          cpfInput.value = formatCNPJ(digits);
        }
        cpfInput.dataset.maxDigits = '14';
        cpfInput.setAttribute('inputmode', 'numeric');
      }
    }

    function onCpfCnpjPaste(e) {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      const digits = onlyDigits(paste);
      const role = roleSelect.value;
      const max = role === 'user' ? 11 : 14;
      const truncated = digits.slice(0, max);
      if (truncated.length <= 11) cpfInput.value = formatCPF(truncated);
      else cpfInput.value = formatCNPJ(truncated);
    }

    // Escuta input e paste
    if (cpfInput) {
      cpfInput.addEventListener('input', applyCpfCnpjMask);
      cpfInput.addEventListener('paste', onCpfCnpjPaste);
      // aplicar máscara inicial (caso o campo tenha valor pré-carregado)
      applyCpfCnpjMask();
    }

    // Quando o papel mudar, reaplicar máscara (por exemplo: organizer -> user)
    roleSelect.addEventListener('change', () => {
      // Forçar revalidação/mascara do campo
      applyCpfCnpjMask();
      // Atualiza o label e placeholder já existente
      const cpfLabel = document.querySelector('label[for="registerCpfCnpj"]');
      if (cpfLabel) {
        if (roleSelect.value === 'organizer') cpfLabel.textContent = 'CPF / CNPJ';
        else cpfLabel.textContent = 'CPF (participante)';
      }
    });

    // --- Máscara de telefone ---
    const formatPhone = (d) => {
      d = d.replace(/\D/g, '').slice(0, 11); // aceitar até 11 (inclui 9 dígitos mobile)
      if (d.length <= 2) return `(${d}`;
      if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
      return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    };

    function applyPhoneMask() {
      if (!phoneInput) return;
      const digits = (phoneInput.value || '').replace(/\D/g, '').slice(0,11);
      phoneInput.value = formatPhone(digits);
      phoneInput.setAttribute('inputmode', 'tel');
    }

    function onPhonePaste(e) {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
      const digits = paste.replace(/\D/g, '').slice(0,11);
      phoneInput.value = formatPhone(digits);
    }

    if (phoneInput) {
      phoneInput.addEventListener('input', applyPhoneMask);
      phoneInput.addEventListener('paste', onPhonePaste);
      applyPhoneMask();
    }

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
    const phoneEl = document.getElementById('registerPhone');
    const cpfEl = document.getElementById('registerCpfCnpj');
    const phone = phoneEl ? phoneEl.value : '';
    const cpf_cnpj = cpfEl ? cpfEl.value : '';
    const errorDiv = document.getElementById('registerError');

    try {
      // Basic normalization: remove non-digits for phone and cpf/cnpj
      const normalizeDigits = v => (v || '').replace(/\D/g,'');
      const payload = { name, email, password, role };
      if(phone) payload.telefone = normalizeDigits(phone);
      if(cpf_cnpj) payload.cpf_cnpj = normalizeDigits(cpf_cnpj);

      // Both roles must provide phone and cpf; participants must provide valid CPF (not CNPJ)
      if(!payload.telefone || !payload.cpf_cnpj){
        throw new Error('Informe telefone e CPF (participante) / CPF ou CNPJ (organizador).');
      }

      // Validation helpers
      const isValidCPF = (cpf) => {
        cpf = (cpf || '').replace(/\D/g,'');
        if (!cpf || cpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cpf)) return false;
        let sum = 0;
        for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (sum % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(9))) return false;
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (sum % 11);
        if (rev === 10 || rev === 11) rev = 0;
        return rev === parseInt(cpf.charAt(10));
      };

      const isValidCNPJ = (cnpj) => {
        cnpj = (cnpj || '').replace(/\D/g,'');
        if (!cnpj || cnpj.length !== 14) return false;
        if (/^(\d)\1+$/.test(cnpj)) return false;
        const t = cnpj.length - 2;
        const digits = cnpj.substring(t);
        const numbers = cnpj.substring(0, t);
        let sum = 0;
        let pos = t - 7;
        for (let i = t; i >= 1; i--) {
          sum += numbers.charAt(t - i) * pos--;
          if (pos < 2) pos = 9;
        }
        let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result != digits.charAt(0)) return false;
        sum = 0;
        pos = t - 7;
        const numbers2 = cnpj.substring(0, t) + digits.charAt(0);
        for (let i = t + 1; i >= 1; i--) {
          sum += numbers2.charAt(t + 1 - i) * pos--;
          if (pos < 2) pos = 9;
        }
        result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        return result == digits.charAt(1);
      };

      // Role-specific validation
      if(role === 'user'){
        if(!isValidCPF(payload.cpf_cnpj)) throw new Error('CPF inválido. Por favor informe um CPF válido (11 dígitos).');
      } else if(role === 'organizer'){
        if(!(isValidCPF(payload.cpf_cnpj) || isValidCNPJ(payload.cpf_cnpj))) throw new Error('CPF ou CNPJ inválido. Informe um documento válido.');
      }

      const response = await api.register(payload);
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
