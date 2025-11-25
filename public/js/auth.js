// Funções utilitárias de máscara reutilizáveis
const onlyDigits = v => (v || '').toString().replace(/\D/g, '');

// Debug: indicar que o arquivo auth.js foi carregado
console.log('[auth.js] loaded');

function formatCPF(d) {
  d = (d || '').toString().replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function formatCNPJ(d) {
  d = (d || '').toString().replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

function formatPhone(d) {
  d = (d || '').toString().replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

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
    // Botões de login e registro (binding direto)
    document.getElementById('loginBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showLoginModal();
    });

    document.getElementById('registerBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showRegisterModal();
    });

    // Delegação de eventos para garantir funcionamento mesmo se o DOM for re-renderizado
    document.addEventListener('click', (e) => {
      const loginTrigger = e.target.closest && e.target.closest('#loginBtn');
      const registerTrigger = e.target.closest && e.target.closest('#registerBtn');
      if (loginTrigger) {
        e.preventDefault();
        this.showLoginModal();
      } else if (registerTrigger) {
        e.preventDefault();
        this.showRegisterModal();
      }
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
    console.log('[auth.js] showLoginModal called');
    const modal = this.createModal('Login', `
      <form id="loginForm">
        <div class="form-group">
          <label for="loginEmail">Email</label>
          <input type="email" id="loginEmail" class="input-field" required autocomplete="username" autocapitalize="none" spellcheck="false">
        </div>
        <div class="form-group">
          <label for="loginPassword">Senha</label>
          <input type="password" id="loginPassword" class="input-field" required autocomplete="current-password">
          <span class="toggle-password" onclick="togglePassword('loginPassword', this)" role="button" aria-pressed="false" tabindex="0" aria-label="Mostrar/ocultar senha" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();togglePassword('loginPassword', this);}">
            <span class="icon-eye" aria-hidden="true">👁️</span>
            <span class="icon-eye-off" aria-hidden="true">🙈</span>
          </span>
        </div>
        <div class="forgot-link-wrapper">
          <a href="/forgot-password.html" class="modal-forgot-link">Esqueceu sua senha?</a>
        </div>
        <div id="loginError"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Entrar</button>
        </div>
      </form>
      <p class="modal-footer-text">
        Não tem conta? <a href="#" id="switchToRegister" class="modal-link-primary">Cadastre-se</a>
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
    console.log('[auth.js] showRegisterModal called');
    const modal = this.createModal('Cadastrar', `
      <form id="registerForm">
        <div class="form-group">
          <label for="registerName">Nome Completo</label>
          <input type="text" id="registerName" class="input-field" required>
        </div>
        <div class="form-group">
          <label for="registerEmail">Email</label>
          <input type="email" id="registerEmail" class="input-field" required autocomplete="email" autocapitalize="none" spellcheck="false">
        </div>
        <div class="form-group">
          <label for="registerPassword">Senha</label>
          <input type="password" id="registerPassword" class="input-field" minlength="6" required autocomplete="new-password">
          <span class="toggle-password" onclick="togglePassword('registerPassword', this)" role="button" aria-pressed="false" tabindex="0" aria-label="Mostrar/ocultar senha" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();togglePassword('registerPassword', this);}">
            <span class="icon-eye" aria-hidden="true">👁️</span>
            <span class="icon-eye-off" aria-hidden="true">🙈</span>
          </span>
          <ul class="password-requirements" aria-live="polite">
            <li id="regLengthReq" class="invalid">Mínimo de 6 caracteres</li>
            <li>Recomendado: letras maiúsculas/minúsculas, números e símbolos</li>
          </ul>
        </div>
        <div class="form-group">
          <label for="registerRole">Tipo de Conta</label>
          <select id="registerRole" class="input-field">
            <option value="user">Participante</option>
            <option value="organizer">Organizador</option>
          </select>
        </div>
  <div class="form-group hidden" id="registerPhoneGroup">
          <label for="registerPhone">Contato (Telefone)</label>
          <input type="tel" id="registerPhone" class="input-field" placeholder="(99) 99999-9999">
        </div>
  <div class="form-group hidden" id="registerCpfCnpjGroup">
          <label for="registerCpfCnpj">CPF / CNPJ</label>
          <input type="text" id="registerCpfCnpj" class="input-field" placeholder="Somente números">
        </div>
        <div id="registerError"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Cadastrar</button>
        </div>
      </form>
      <p class="modal-footer-text">
        Já tem conta? <a href="#" id="switchToLogin" class="modal-link-primary">Faça login</a>
      </p>
    `);

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegister();
    });

    // Validação em tempo real da senha de cadastro
    const regPassInput = document.getElementById('registerPassword');
    const regLenReq = document.getElementById('regLengthReq');
    if (regPassInput && regLenReq) {
      regPassInput.addEventListener('input', (e) => {
        const ok = (e.target.value || '').length >= 6;
        regLenReq.classList.toggle('valid', ok);
        regLenReq.classList.toggle('invalid', !ok);
      });
    }

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

    // --- Máscara e comportamento do campo CPF / CNPJ (usa as funções reutilizáveis definidas no topo do arquivo) ---

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

    // --- Máscara de telefone (usa a função reutilizável `formatPhone`) ---

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
  // Basic normalization: remove non-digits for phone and cpf/cnpj using shared helper
  const payload = { name, email, password, role };
  if (phone) payload.telefone = onlyDigits(phone);
  if (cpf_cnpj) payload.cpf_cnpj = onlyDigits(cpf_cnpj);

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
          <input type="email" id="profileEmail" class="input-field" value="${user.email}" required autocomplete="email" autocapitalize="none" spellcheck="false">
        </div>
        <div class="form-group">
          <label for="profilePhone">Telefone</label>
          <input type="tel" id="profilePhone" class="input-field" value="${user.telefone || user.phone || ''}" placeholder="(99) 99999-9999">
        </div>
        <div class="form-group">
          <label for="profileCpfCnpj">CPF / CNPJ</label>
          <input type="text" id="profileCpfCnpj" class="input-field" value="${user.cpf_cnpj || user.cpfCnpj || ''}" placeholder="Somente números">
        </div>
        <div id="profileError"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
  <hr class="modal-divider">
  <h3 class="modal-subtitle">Alterar Senha</h3>
      <form id="passwordForm">
        <div class="form-group">
          <label for="currentPassword">Senha Atual</label>
          <input type="password" id="currentPassword" class="input-field" required autocomplete="current-password">
          <span class="toggle-password" onclick="togglePassword('currentPassword', this)" role="button" aria-pressed="false" tabindex="0" aria-label="Mostrar/ocultar senha" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();togglePassword('currentPassword', this);}">
            <span class="icon-eye" aria-hidden="true">👁️</span>
            <span class="icon-eye-off" aria-hidden="true">🙈</span>
          </span>
        </div>
        <div class="form-group">
          <label for="newPassword">Nova Senha</label>
          <input type="password" id="newPassword" class="input-field" minlength="6" required autocomplete="new-password">
          <span class="toggle-password" onclick="togglePassword('newPassword', this)" role="button" aria-pressed="false" tabindex="0" aria-label="Mostrar/ocultar senha" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();togglePassword('newPassword', this);}">
            <span class="icon-eye" aria-hidden="true">👁️</span>
            <span class="icon-eye-off" aria-hidden="true">🙈</span>
          </span>
          <ul class="password-requirements" aria-live="polite">
            <li id="chgLengthReq" class="invalid">Mínimo de 6 caracteres</li>
            <li>Recomendado: letras maiúsculas/minúsculas, números e símbolos</li>
          </ul>
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

    // --- Máscaras e comportamento para telefone e CPF/CNPJ no perfil ---
    const profilePhone = document.getElementById('profilePhone');
    const profileCpf = document.getElementById('profileCpfCnpj');

    function applyCpfCnpjMaskProfile() {
      if (!profileCpf) return;
      const digits = onlyDigits(profileCpf.value);
      if (digits.length <= 11) profileCpf.value = formatCPF(digits);
      else profileCpf.value = formatCNPJ(digits);
      profileCpf.setAttribute('inputmode', 'numeric');
    }

    function onCpfCnpjPasteProfile(e) {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      const digits = onlyDigits(paste).slice(0,14);
      if (digits.length <= 11) profileCpf.value = formatCPF(digits);
      else profileCpf.value = formatCNPJ(digits);
    }

    function applyPhoneMaskProfile() {
      if (!profilePhone) return;
      const digits = onlyDigits(profilePhone.value).slice(0,11);
      profilePhone.value = formatPhone(digits);
      profilePhone.setAttribute('inputmode', 'tel');
    }

    function onPhonePasteProfile(e) {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
      const digits = onlyDigits(paste).slice(0,11);
      profilePhone.value = formatPhone(digits);
    }

    if (profileCpf) {
      profileCpf.addEventListener('input', applyCpfCnpjMaskProfile);
      profileCpf.addEventListener('paste', onCpfCnpjPasteProfile);
      applyCpfCnpjMaskProfile();
    }
    if (profilePhone) {
      profilePhone.addEventListener('input', applyPhoneMaskProfile);
      profilePhone.addEventListener('paste', onPhonePasteProfile);
      applyPhoneMaskProfile();
    }

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleChangePassword();
    });

    // Validação em tempo real da nova senha no perfil
    const chgPassInput = document.getElementById('newPassword');
    const chgLenReq = document.getElementById('chgLengthReq');
    if (chgPassInput && chgLenReq) {
      chgPassInput.addEventListener('input', (e) => {
        const ok = (e.target.value || '').length >= 6;
        chgLenReq.classList.toggle('valid', ok);
        chgLenReq.classList.toggle('invalid', !ok);
      });
    }
  }

  async handleUpdateProfile() {
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const profilePhoneEl = document.getElementById('profilePhone');
    const profileCpfEl = document.getElementById('profileCpfCnpj');
    const errorDiv = document.getElementById('profileError');



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
        sum += numbers2.charAt(t + 1 - i) * pos--; if (pos < 2) pos = 9;
      }
      result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      return result == digits.charAt(1);
    };

    try {
      const payload = { name, email };
  if (profilePhoneEl && profilePhoneEl.value) payload.telefone = onlyDigits(profilePhoneEl.value);
  if (profileCpfEl && profileCpfEl.value) payload.cpf_cnpj = onlyDigits(profileCpfEl.value);

      // Basic client-side validation: if CPF/CNPJ provided, validate format
      if (payload.cpf_cnpj) {
        const digits = payload.cpf_cnpj;
        if (!(digits.length === 11 ? isValidCPF(digits) : digits.length === 14 ? isValidCNPJ(digits) : false)) {
          throw new Error('CPF ou CNPJ inválido. Verifique antes de salvar.');
        }
      }

      const response = await api.updateProfile(payload);
      // Atualizar usuário no localStorage
      const user = api.getCurrentUser();
      user.name = name;
      user.email = email;
      if (payload.telefone) user.telefone = payload.telefone;
      if (payload.cpf_cnpj) user.cpf_cnpj = payload.cpf_cnpj;
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
    // Redireciona para a página dedicada de inscrições em vez de abrir modal
    window.location.href = '/my-enrollments.html';
  }

  createModal(title, content) {
    const modalHTML = `
      <div class="modal-overlay" onclick="if(event.target === this) closeModal()">
        <div class="modal">
          <button class="modal-close" onclick="closeModal()" aria-label="Fechar modal">&times;</button>
          <div class="modal-header">
            <h2>${title}</h2>
          </div>
          <div class="modal-body">
            ${content}
          </div>
        </div>
      </div>
    `;

  const container = document.getElementById('modalContainer');
  console.log('[auth.js] createModal called for:', title, 'modalContainer present:', !!container);
  if (container) {
    container.innerHTML = modalHTML;
  } else {
    // fallback: anexar ao body sem sobrescrever o conteúdo existente
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
  const overlayEl = document.querySelector('.modal-overlay');
  console.log('[auth.js] modal inserted. overlayExists:', !!overlayEl);
  // Fallback robusto: garantir estilos inline mínimos para que o modal seja visível
  if (overlayEl) {
    try {
      overlayEl.style.position = overlayEl.style.position || 'fixed';
      overlayEl.style.top = overlayEl.style.top || '0';
      overlayEl.style.left = overlayEl.style.left || '0';
      overlayEl.style.right = overlayEl.style.right || '0';
      overlayEl.style.bottom = overlayEl.style.bottom || '0';
      overlayEl.style.zIndex = overlayEl.style.zIndex || '99999';
      overlayEl.style.display = overlayEl.style.display || 'flex';
      overlayEl.style.alignItems = overlayEl.style.alignItems || 'center';
      overlayEl.style.justifyContent = overlayEl.style.justifyContent || 'center';
      overlayEl.style.background = overlayEl.style.background || 'rgba(0,0,0,0.7)';
      overlayEl.style.padding = overlayEl.style.padding || '1rem';
    } catch (err) {
      console.warn('[auth.js] failed to apply inline overlay styles', err);
    }
  }
  // Apply inline styles to inner modal element intentionally removed so external CSS controls the modal appearance.
  // This prevents inline styles from overriding author stylesheet. Rely on CSS rules in /css/style.css.
  try { document.body.classList.add('modal-open'); } catch {}
  }
}

// Função global para fechar modal
function closeModal() {
  console.log('[auth.js] closeModal called');
  const container = document.getElementById('modalContainer');
  if (container) {
    container.innerHTML = '';
  } else {
    // caso o modal tenha sido anexado diretamente ao body
    const overlay = document.querySelector('.modal-overlay');
    if (overlay && overlay.parentElement === document.body) {
      document.body.removeChild(overlay);
    }
  }
  try { document.body.classList.remove('modal-open'); } catch {}
}

// Função global para alternar visibilidade da senha
function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.setAttribute('aria-pressed', 'true');
  } else {
    input.type = 'password';
    icon.setAttribute('aria-pressed', 'false');
  }
}

// Inicializar quando o DOM estiver pronto
function _initAuth() {
  window.authManager = new AuthManager();
  console.log('[auth.js] AuthManager initialized');
  // Abrir modais via hash (#login, #register)
  const openFromHash = () => {
    const h = (location.hash || '').toLowerCase();
    if (h === '#login') window.authManager.showLoginModal();
    if (h === '#register') window.authManager.showRegisterModal();
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initAuth);
} else {
  _initAuth();
}

// Helpers globais para abrir modais programaticamente
window.openLoginModal = () => window.authManager && window.authManager.showLoginModal();
window.openRegisterModal = () => window.authManager && window.authManager.showRegisterModal();
