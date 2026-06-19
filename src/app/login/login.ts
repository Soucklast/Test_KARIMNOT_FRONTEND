import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsoDeAPI } from '../Servicios/uso-de-api';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email: string = '';
  password: string = '';
  hidePassword: boolean = true;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private UsoDeAPI: UsoDeAPI, private router: Router) {}

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.UsoDeAPI.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = 'Correo o contraseña incorrectos';
        } else if (err.status === 403) {
          this.errorMessage = 'Usuario inactivo, contacta al administrador';
        } else if (err.status === 422) {
          this.errorMessage = 'Revisa los datos ingresados';
        } else {
          this.errorMessage = 'Error de conexión con el servidor';
        }
      },
    });
  }
}
