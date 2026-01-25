# QR Dinámico 📱

Una aplicación web moderna para crear y gestionar códigos QR dinámicos. A diferencia de los códigos QR tradicionales, estos QR codes permiten actualizar la URL de destino en cualquier momento sin necesidad de regenerar o reimprimir el código.

## ✨ Características

- **QR Dinámicos**: Cambia la URL de destino cuando quieras sin regenerar el QR
- **Creación Anónima**: Cualquiera puede crear QR codes sin necesidad de registrarse
- **Gestión con Google OAuth**: Inicia sesión con Google para gestionar tus QR codes
- **Interfaz Moderna**: Diseño oscuro con efectos glassmorphism y animaciones suaves
- **Responsive**: Funciona perfectamente en móviles, tablets y desktop
- **Instantáneo**: Redirección rápida sin intermediarios

## 🚀 Tecnologías

- **Backend**: Node.js + Express
- **Base de Datos**: SQLite (usando sql.js - sin necesidad de compilación nativa)
- **Autenticación**: Passport.js + Google OAuth 2.0
- **QR Codes**: qrcode library
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- Una cuenta de Google
- Google Cloud Console (para OAuth credentials)

## 🔧 Instalación

### 1. Clonar o descargar el proyecto

El proyecto ya está en el directorio actual.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Google OAuth

Para que la autenticación funcione, necesitas crear credenciales de Google OAuth:

#### Paso 1: Ir a Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente

#### Paso 2: Habilitar Google+ API

1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca "Google+ API" y habilítala

#### Paso 3: Crear credenciales OAuth

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth client ID**
3. Si es necesario, configura la pantalla de consentimiento OAuth:
   - User Type: External
   - Información de la app: Nombre, email de soporte
   - Scopes: Añade `email` y `profile`
   - Guarda y continúa
4. Vuelve a **Credentials** > **Create Credentials** > **OAuth client ID**
5. Selecciona **Web application**
6. Configura:
   - **Nombre**: QR Dinámico (o el que prefieras)
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/auth/google/callback`
7. Haz clic en **Create**
8. **Copia el Client ID y Client Secret** (los necesitarás en el siguiente paso)

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto (copia `.env.example`):

```bash
cp .env.example .env
```

Edita el archivo `.env` y completa con tus credenciales:

```env
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
SESSION_SECRET=genera_una_cadena_aleatoria_segura
BASE_URL=http://localhost:3000
PORT=3000
```

**Importante**: 
- Reemplaza `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` con los valores de Google Cloud Console
- Para `SESSION_SECRET`, genera una cadena aleatoria segura (puedes usar un generador online)

### 5. Iniciar la aplicación

**Modo desarrollo** (con reinicio automático):
```bash
npm run dev
```

**Modo producción**:
```bash
npm start
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📖 Uso

### Crear QR Anónimo

1. Ve a la página principal
2. Ingresa una URL en el formulario "Crear QR Rápido"
3. Haz clic en "Generar QR"
4. Tu código QR se generará instantáneamente
5. Copia la URL corta y compártela

**Nota**: Los QR anónimos no pueden ser editados o eliminados posteriormente.

### Gestionar QR Codes (con login)

1. Haz clic en "Iniciar sesión con Google"
2. Autoriza la aplicación
3. Serás redirigido al dashboard
4. Desde aquí puedes:
   - **Crear** nuevos QR codes
   - **Editar** la URL de destino de tus QR codes existentes
   - **Copiar** la URL corta al portapapeles
   - **Eliminar** QR codes que ya no necesites

### Actualizar un QR Dinámico

1. En el dashboard, localiza el QR code que quieres actualizar
2. Haz clic en el botón "✏️ Editar"
3. Ingresa la nueva URL de destino
4. Haz clic en "Guardar"

**¡Importante!**: El código QR físico y la URL corta **no cambian**. Solo cambia la URL de destino a la que redirige.

## 🗂️ Estructura del Proyecto

```
qrdinamico/
├── server/
│   ├── db/
│   │   ├── database.js      # Conexión y operaciones de SQLite
│   │   └── schema.sql       # Esquema de base de datos
│   ├── routes/
│   │   ├── auth.js          # Rutas de autenticación Google OAuth
│   │   ├── qr.js            # CRUD de QR codes
│   │   └── redirect.js      # Lógica de redirección
│   ├── middleware/
│   │   └── auth.js          # Middleware de autenticación
│   ├── config/
│   │   └── passport.js      # Configuración de Passport
│   └── server.js            # Servidor Express principal
├── public/
│   ├── css/
│   │   └── styles.css       # Sistema de diseño y estilos
│   ├── js/
│   │   ├── app.js           # Lógica de la landing page
│   │   └── dashboard.js     # Lógica del dashboard
│   ├── index.html           # Página principal
│   └── dashboard.html       # Dashboard de usuario
├── .env                     # Variables de entorno (no versionado)
├── .env.example             # Plantilla de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Seguridad

- Las contraseñas no se almacenan (OAuth de Google)
- Las sesiones expiran después de 24 horas
- Solo los propietarios pueden editar o eliminar sus QR codes
- Validación de URLs en el backend
- HTTPS recomendado para producción

## 🚀 Despliegue en Producción

### Variables de entorno para producción

Actualiza tu `.env`:

```env
GOOGLE_CLIENT_ID=tu_client_id_produccion
GOOGLE_CLIENT_SECRET=tu_client_secret_produccion
SESSION_SECRET=genera_una_nueva_cadena_segura
BASE_URL=https://tu-dominio.com
PORT=3000
NODE_ENV=production
```

### Actualizar Google OAuth para producción

1. Ve a Google Cloud Console > Credentials
2. Edita tu OAuth Client ID
3. Añade tu dominio de producción a:
   - **Authorized JavaScript origins**: `https://tu-dominio.com`
   - **Authorized redirect URIs**: `https://tu-dominio.com/auth/google/callback`

### Recomendaciones

- Usa HTTPS en producción (obligatorio para OAuth)
- Configura un reverse proxy (Nginx, Apache)
- Considera usar PM2 para gestionar el proceso Node.js
- Haz backups regulares de la base de datos SQLite (`qrdinamico.db`)

### Despliegue en Railway

Railway es la opción más sencilla para desplegar esta aplicación:

1.  **Conectar GitHub**: Crea un nuevo proyecto en Railway y selecciona tu repositorio `qrdinamico`.
2.  **Configurar Variables**: En la pestaña "Variables", añade:
    *   `NODE_ENV`: `production`
    *   `BASE_URL`: Tu URL de Railway (ej: `https://...up.railway.app`)
    *   `SESSION_SECRET`: Una cadena aleatoria larga.
    *   `DATABASE_PATH`: `/data/qrdinamico.db` (Importante para persistencia).
3.  **Montar Volumen**:
    *   Ve a la pestaña **Settings** de tu servicio en Railway.
    *   Busca la sección **Volumes** y haz clic en "Add Volume".
    *   Configura el Mount Path como `/data`.
    *   Esto asegurará que tu base de datos SQLite no se borre al reiniciar el servidor.
4.  **Health Check**: Railway detectará automáticamente el endpoint `/health` que hemos configurado para verificar que la app está lista.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - siéntete libre de usar este proyecto como quieras.

## 🐛 Solución de Problemas

### Error: "Google OAuth callback failed"

- Verifica que las Authorized redirect URIs en Google Cloud Console sean exactas
- Asegúrate de que `BASE_URL` en `.env` coincida con la URL en Google Console

### Error: "Unable to open database file"

- Asegúrate de que la aplicación tenga permisos de escritura en el directorio
- La base de datos se creará automáticamente en la primera ejecución

### Los QR codes no se muestran

- Verifica que el servidor esté corriendo
- Revisa la consola del navegador para errores JavaScript
- Asegúrate de que estés autenticado correctamente

## ❓ Preguntas Frecuentes

**¿Puedo crear QR codes sin iniciar sesión?**
Sí, pero no podrás editarlos o eliminarlos posteriormente.

**¿Cuántos QR codes puedo crear?**
No hay límite.

**¿Caducan los QR codes?**
No, son permanentes a menos que los elimines manualmente.

**¿Puedo rastrear cuántas veces se escanea un QR?**
Actualmente no, pero es una feature planeada para futuras versiones.

## 💡 Ideas para Mejoras Futuras

- [ ] Analytics: Rastreo de escaneos por QR
- [ ] Personalización: QR codes con colores y logos
- [ ] Códigos cortos personalizados
- [ ] API REST pública
- [ ] Exportar lista de QR codes
- [ ] Fechas de expiración opcionales
- [ ] Múltiples dominios para URLs cortas

---

**Hecho con ❤️ para crear QR codes dinámicos**
