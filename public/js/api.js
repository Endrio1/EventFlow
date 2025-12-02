// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Classe para gerenciar as requisições à API
class API {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Obter token do localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Obter headers padrão
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Requisição genérica
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(options.auth),
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, auth = false) {
    return this.request(endpoint, {
      method: 'GET',
      auth
    });
  }

  // POST request
  async post(endpoint, data, auth = false) {
    return this.request(endpoint, {
      method: 'POST',
      auth,
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data, auth = false) {
    return this.request(endpoint, {
      method: 'PUT',
      auth,
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint, auth = false) {
    return this.request(endpoint, {
      method: 'DELETE',
      auth
    });
  }

  // Upload de arquivo
  async upload(endpoint, formData, auth = true) {
    try {
      const headers = {};
      if (auth) {
        const token = this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro no upload');
      }

      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }

  // Autenticação
  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.data.token) {
      this.saveAuthData(response.data);
    }
    return response;
  }

  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.data.token) {
      this.saveAuthData(response.data);
    }
    return response;
  }

  async getProfile() {
    return this.get('/auth/profile', true);
  }

  async updateProfile(data) {
    return this.put('/auth/profile', data, true);
  }

  async changePassword(data) {
    return this.put('/auth/change-password', data, true);
  }

  // Salvar dados de autenticação
  saveAuthData(data) {
    // Normalize user fields to keep frontend consistent regardless of backend field names
    const user = { ...data.user };
    // Support both portuguese and english field names produced by the migration
    if (user.nome && !user.name) user.name = user.nome;
    if (user.papel && !user.role) user.role = user.papel;
    if (user._id && !user.id) user.id = user._id;

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Limpar dados de autenticação
  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Verificar se está autenticado
  isAuthenticated() {
    return !!this.getToken();
  }

  // Obter usuário atual
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Eventos
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/events?${queryString}`);
  }

  async getEvent(id) {
    return this.get(`/events/${id}`);
  }

  // Feedbacks
  async getFeedbacks(eventId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/events/${eventId}/feedbacks${qs ? `?${qs}` : ''}`);
  }

  async createFeedback(eventId, data) {
    return this.post(`/events/${eventId}/feedbacks`, data, true);
  }

  async updateFeedback(feedbackId, data) {
    return this.put(`/feedbacks/${feedbackId}`, data, true);
  }

  async deleteFeedback(feedbackId) {
    return this.delete(`/feedbacks/${feedbackId}`, true);
  }

  async createEvent(formData) {
    return this.upload('/events', formData, true);
  }

  async updateEvent(id, formData) {
    try {
      const headers = {};
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${this.baseURL}/events/${id}`, {
        method: 'PUT',
        headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Erro ao atualizar evento');

      return data;
    } catch (error) {
      console.error('Update Event Error:', error);
      throw error;
    }
  }

  async setSalesStatus(id, closed) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${this.baseURL}/events/${id}/sales`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ closed })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao atualizar vendas');
    return data;
  }

  async deleteEvent(id) {
    return this.delete(`/events/${id}`, true);
  }

  // Admin endpoints
  async getUsers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/admin/users${qs ? `?${qs}` : ''}`, true);
  }

  async deleteUser(id) {
    return this.delete(`/admin/users/${id}`, true);
  }

  async getMyEvents() {
    return this.get('/events/organizer/my-events', true);
  }

  // Inscrições
  async enrollEvent(eventId) {
    return this.post(`/enrollments/events/${eventId}/enroll`, {}, true);
  }

  async cancelEnrollment(eventId) {
    return this.delete(`/enrollments/events/${eventId}/cancel`, true);
  }

  async getMyEnrollments() {
    return this.get('/enrollments/my-enrollments', true);
  }

  async getEventParticipants(eventId) {
    return this.get(`/enrollments/events/${eventId}/participants`, true);
  }

  // Atividades
  async getEventActivities(eventId) {
    return this.get(`/events/${eventId}/activities`);
  }

  async getActivity(activityId) {
    return this.get(`/activities/${activityId}`);
  }

  async createActivity(eventId, data) {
    return this.post(`/events/${eventId}/activities`, data, true);
  }

  async updateActivity(activityId, data) {
    return this.put(`/activities/${activityId}`, data, true);
  }

  async deleteActivity(activityId) {
    return this.delete(`/activities/${activityId}`, true);
  }
}

// Exportar instância da API
const api = new API();
