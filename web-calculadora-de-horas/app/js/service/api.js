const API_BASE_URL = "http://localhost:3001";

export const API_ENDPOINTS = {
  createTempUser: `${API_BASE_URL}/api/users/temp`,
  getUser: (id) => `${API_BASE_URL}/api/users/${id}`,
  createConversion: `${API_BASE_URL}/api/conversions`,
  getConversion: (id) => `${API_BASE_URL}/api/conversions/${id}`,
  getUserConversions: (userId) =>
    `${API_BASE_URL}/api/conversions/user/${userId}`,
  updateConversion: (id) => `${API_BASE_URL}/api/conversions/${id}`,
  deleteConversion: (id) => `${API_BASE_URL}/api/conversions/${id}`,
};

export class ApiService {
  static async createTempUser() {
    const response = await fetch(API_ENDPOINTS.createTempUser, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Erro ao criar usuário");
    return response.json();
  }

  static async getUser(userId) {
    const response = await fetch(API_ENDPOINTS.getUser(userId));
    if (!response.ok) throw new Error("Erro ao buscar usuário");
    return response.json();
  }

  static async saveConversion(conversionData) {
    const response = await fetch(API_ENDPOINTS.createConversion, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(conversionData),
    });
    if (!response.ok) throw new Error("Erro ao salvar conversão");
    return response.json();
  }

  static async getUserConversions(userId) {
    const response = await fetch(API_ENDPOINTS.getUserConversions(userId));
    if (!response.ok) throw new Error("Erro ao carregar histórico");
    return response.json();
  }

  static async deleteConversion(conversionId) {
    const response = await fetch(API_ENDPOINTS.deleteConversion(conversionId), {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Erro ao deletar conversão");
    return response.json();
  }
}

export default ApiService;
