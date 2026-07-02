import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

// Interfaces para los tipos de datos
export interface Usuario {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber: string;
  role: 'Admin' | 'User';
  status: 'Active' | 'Inactive';
  address?: {
    street?: string;
    number?: string;
    city?: string;
    postalCode?: string;
  };
  profilePicture?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface UserFormOptions {
  roles: string[];
  statuses: string[];
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
  detalle?: any;
}

export interface LoginResponse {
  message: string;
  token: string;
  usuario: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
  };
}

export interface EmailVerificationResponse {
  available: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsoDeAPI {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient, private router: Router) {}

  private getAuthOptions() {
    const token = this.getToken();

    if (!token) {
      return {};
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  // ===== AUTENTICACION =====
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('usuario', JSON.stringify(response.usuario));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUsuarioLocal(): any {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ===== USUARIOS CRUD =====
  /**
   * GET /api/users - Obtiene lista de usuarios paginada
   * @param page - Numero de pagina (default 1)
   * @param limit - Cantidad de usuarios por pagina (default 10)
   * @param search - Buscar en firstName, lastName, email, phoneNumber
   */
  getUsuarios(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    role: string = '',
    status: string = ''
  ): Observable<PaginatedResponse<Usuario>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (role) {
      params = params.set('role', role);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PaginatedResponse<Usuario>>(`${this.apiUrl}/users`, {
      params,
      ...this.getAuthOptions(),
    });
  }

  /**
   * GET /api/users/options - Obtiene los valores disponibles para rol y estado
   */
  getUserFormOptions(): Observable<ApiResponse<UserFormOptions>> {
    return this.http.get<ApiResponse<UserFormOptions>>(`${this.apiUrl}/users/options`, this.getAuthOptions());
  }

  /**
   * POST /api/users - Crea un nuevo usuario
   */
  crearUsuario(usuario: Usuario): Observable<ApiResponse<Usuario>> {
    return this.http.post<ApiResponse<Usuario>>(`${this.apiUrl}/users`, usuario, this.getAuthOptions());
  }

  /**
   * GET /api/users/{id} - Obtiene un usuario especifico por ID
   */
  obtenerUsuario(id: number): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/users/${id}`, this.getAuthOptions());
  }

  /**
   * PUT /api/users/{id} - Actualiza un usuario
   */
  actualizarUsuario(id: number, usuario: Partial<Usuario>): Observable<ApiResponse<Usuario>> {
    return this.http.put<ApiResponse<Usuario>>(`${this.apiUrl}/users/${id}`, usuario, this.getAuthOptions());
  }

  /**
   * DELETE /api/users/{id} - Elimina un usuario
   */
  eliminarUsuario(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/users/${id}`, this.getAuthOptions());
  }

  /**
   * GET /api/users/verify/{email} - Verifica disponibilidad de email
   */
  verificarEmail(email: string): Observable<EmailVerificationResponse> {
    return this.http.get<EmailVerificationResponse>(
      `${this.apiUrl}/users/verify/${email}`,
      this.getAuthOptions()
    );
  }
}
