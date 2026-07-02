import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsoDeAPI, Usuario } from '../Servicios/uso-de-api';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  isMenuOpen = false;
  selectedMenuItem = 'dashboard';
  isLoading = false;

  // Datos
  users: Usuario[] = [];
  roles: string[] = ['Admin', 'User'];
  statuses: string[] = ['Active', 'Inactive'];
  currentUserId: number | null = null;

  // Búsqueda
  searchTerm = '';
  private searchTimeout: any;
  selectedRoleFilter = '';
  selectedStatusFilter = '';

  // Paginación
  currentPage = 1;
  perPage = 10;
  totalUsers = 0;
  lastPage = 1;

  // Modal de agregar/editar
  showModal = false;
  modalMode: 'crear' | 'editar' = 'crear';
  errorMessage = '';
  formData: Usuario = this.getEmptyForm();

  // Confirmación de eliminar
  showDeleteConfirm = false;
  userToDelete: Usuario | null = null;

  constructor(private api: UsoDeAPI) {}

  ngOnInit(): void {
    this.currentUserId = this.api.getUsuarioLocal()?.id ?? null;
    this.cargarOpcionesFormulario();
    this.cargarUsuarios();
  }

  // ===== CARGA / BÚSQUEDA / PAGINACIÓN =====

  cargarUsuarios(): void {
    this.isLoading = true;
    this.api
      .getUsuarios(
        this.currentPage,
        this.perPage,
        this.searchTerm,
        this.selectedRoleFilter,
        this.selectedStatusFilter
      )
      .subscribe({
      next: (response) => {
        this.users = response.data;
        this.totalUsers = response.pagination.total;
        this.lastPage = response.pagination.last_page;
        this.currentPage = response.pagination.current_page;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al obtener usuarios:', error);
        this.isLoading = false;
      },
    });
  }

  cargarOpcionesFormulario(): void {
    this.api.getUserFormOptions().subscribe({
      next: (response) => {
        const options = response.data;
        if (options?.roles?.length) {
          this.roles = options.roles;
        }
        if (options?.statuses?.length) {
          this.statuses = options.statuses;
        }
      },
      error: (error) => {
        console.error('Error al obtener opciones del formulario:', error);
      },
    });
  }

  onSearchChange(): void {
    // Debounce para no disparar una petición por cada tecla
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.cargarUsuarios();
    }, 400);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.cargarUsuarios();
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.lastPage) return;
    this.currentPage = pagina;
    this.cargarUsuarios();
  }

  paginaAnterior(): void {
    this.irAPagina(this.currentPage - 1);
  }

  paginaSiguiente(): void {
    this.irAPagina(this.currentPage + 1);
  }

  // ===== MODAL CREAR / EDITAR =====

  abrirModalCrear(): void {
    this.modalMode = 'crear';
    this.formData = this.getEmptyForm();
    this.errorMessage = '';
    this.showModal = true;
  }

  abrirModalEditar(user: Usuario): void {
    this.modalMode = 'editar';
    this.formData = { ...user, password: '' }; // password vacío = no se cambia
    this.errorMessage = '';
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.formData = this.getEmptyForm();
    this.errorMessage = '';
  }

  guardarUsuario(): void {
    this.errorMessage = '';

    if (this.modalMode === 'crear') {
      this.api.crearUsuario(this.formData).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: (err) => this.manejarErrorForm(err),
      });
    } else {
      // En edición, si no se escribió password, no lo enviamos
      const payload: Partial<Usuario> = { ...this.formData };
      if (!payload.password) {
        delete payload.password;
      }

      this.api.actualizarUsuario(this.formData.id!, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: (err) => this.manejarErrorForm(err),
      });
    }
  }

  private manejarErrorForm(err: any): void {
    if (err.status === 422 && err.error?.detalle) {
      const errores = Object.values(err.error.detalle).flat();
      this.errorMessage = errores.join(' | ');
    } else {
      this.errorMessage = err.error?.error || 'Error al guardar el usuario';
    }
  }

  private getEmptyForm(): Usuario {
    return {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phoneNumber: '',
      role: 'User',
      status: 'Active',
    };
  }

  // ===== ELIMINAR =====

  confirmarEliminar(user: Usuario): void {
    if (this.isCurrentUser(user)) {
      this.errorMessage = 'No puedes eliminar tu propio usuario';
      return;
    }

    this.userToDelete = user;
    this.showDeleteConfirm = true;
  }

  cancelarEliminar(): void {
    this.userToDelete = null;
    this.showDeleteConfirm = false;
  }

  eliminarUsuario(): void {
    if (!this.userToDelete?.id) return;

    if (this.isCurrentUser(this.userToDelete)) {
      this.cancelarEliminar();
      this.errorMessage = 'No puedes eliminar tu propio usuario';
      return;
    }

    this.api.eliminarUsuario(this.userToDelete.id).subscribe({
      next: () => {
        this.cancelarEliminar();
        // Si eliminamos el último usuario de la página actual, retrocede una página
        if (this.users.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
        this.cancelarEliminar();
      },
    });
  }

  // ===== UI GENERAL =====

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  selectMenuItem(item: string): void {
    this.selectedMenuItem = item;
    this.isMenuOpen = false;
  }

  logout(): void {
    this.api.logout();
  }

  isCurrentUser(user: Usuario): boolean {
    return !!user.id && user.id === this.currentUserId;
  }
}
