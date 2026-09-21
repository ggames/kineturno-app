import axios, { AxiosError } from 'axios';

// Cliente Axios centralizado para KineTurnos
export const clienteApi = axios.create({
  baseURL: 'http://localhost:3000',  //import.meta.env.VITE_API_BASE_URL ||
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Peticiones: inyecta el Token JWT almacenado
clienteApi.interceptors.request.use(
  (configuracion) => {
    const token = localStorage.getItem('token_kineturnos');
    if (token && configuracion.headers) {
      configuracion.headers.Authorization = `Bearer ${token}`;
    }
    return configuracion;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuestas: transforma los mensajes de error al español de Argentina (voseo)
clienteApi.interceptors.response.use(
  (respuesta) => respuesta,
  (error: AxiosError<{ message?: string | string[]; error?: string }>) => {
    let mensajeRespuesta = 'No se pudo conectar con el servidor. Intentá de nuevo más tarde.';

    if (error.response) {
      const datos = error.response.data;
      if (datos) {
        if (Array.isArray(datos.message)) {
          mensajeRespuesta = datos.message.join('. ');
        } else if (typeof datos.message === 'string') {
          mensajeRespuesta = datos.message;
        } else if (datos.error) {
          mensajeRespuesta = datos.error;
        }
      }

      const urlPeticion = error.config?.url || '';

      if (error.response.status === 401) {
        // No borrar la sesión si el error viene de rutas de autenticación
        if (!urlPeticion.includes('/auth/login') && !urlPeticion.includes('/auth/register')) {
          localStorage.removeItem('token_kineturnos');
          localStorage.removeItem('usuario_kineturnos');
          window.dispatchEvent(new Event('auth:unauthorized'));
          mensajeRespuesta = 'Tu sesión expiró o no tenés autorización. Por favor, volvé a iniciar sesión.';
        } else {
          mensajeRespuesta = 'Credenciales incorrectas. Verificá tu correo y contraseña e intentá de nuevo.';
        }
      } else if (error.response.status === 403) {
        mensajeRespuesta = 'No tenés permisos suficientes para realizar esta acción.';
      } else if (error.response.status === 404) {
        mensajeRespuesta = 'El recurso solicitado no fue encontrado.';
      } else if (error.response.status === 409) {
        mensajeRespuesta = 'Ya existe un registro con esos datos o fecha en la base de datos.';
      }
    } else if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('Network Error'))) {
      mensajeRespuesta = 'Error de conexión. Comprobá tu conexión a internet o verificá que el servidor esté activo.';
    }

    return Promise.reject(new Error(mensajeRespuesta));
  }
);
