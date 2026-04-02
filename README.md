# Plantilla Base de Autenticación (NestJS + Prisma + JWT)

Este repositorio está preparado para ser tu **template inicial** en proyectos nuevos con:

- Registro y login con JWT.
- Sistema de autorización con **usuarios, roles y permisos**.
- Persistencia con Prisma.
- Seguridad base (Helmet, CORS, ValidationPipe, throttling).
- Testing con el framework **oficial por defecto de NestJS: Jest**.

---

## 1) Stack

- NestJS 11
- Prisma
- PostgreSQL/MySQL (según `DATABASE_URL`)
- JWT + Passport
- Jest + ts-jest + supertest

---

## 2) Scripts principales

```bash
npm run start:dev
npm run lint
npm run test
npm run test:cov
npm run test:e2e
```

---

## 3) Testing recomendado para esta plantilla (NestJS/Jest)

### Unit tests (rápidos y aislados)

- `AuthService`
  - registro exitoso
  - conflicto por email duplicado
  - login exitoso
  - login inválido
- `AuthController`
  - delega en el servicio y retorna respuesta esperada
- Guards
  - `RolesGuard` (permite/deniega según metadata)
  - `PermissionsGuard` (permite/deniega según metadata)

### Integration tests (módulo + DB de pruebas)

- Flujo `register -> login -> endpoint protegido`
- Asignación de rol por defecto al registrar usuario
- Resolución de permisos efectivos por rol

### E2E tests

- `POST /api/auth/register`
- `POST /api/auth`
- Endpoint protegido con JWT válido/inválido
- Endpoint protegido con rol/permisos insuficientes

> Sugerencia: para CI, usa una base de datos de pruebas separada y ejecuta migraciones antes de correr e2e.

---

## 4) Mejoras sugeridas para robustecer la plantilla

1. **Refresh tokens + rotación**
   - Access token corto (ej. 15m) y refresh token revocable.
2. **Revocación de sesión**
   - Tabla de sesiones/tokens para logout real.
3. **Auditoría**
   - Registrar eventos de seguridad: login, logout, intentos fallidos, cambios de rol.
4. **Semillas de seguridad**
   - Seed inicial de permisos y roles (`ADMIN`, `USER`) para entornos nuevos.
5. **Políticas de contraseña**
   - Requisitos mínimos y bloqueo temporal por intentos fallidos.
6. **Healthcheck y observabilidad**
   - Endpoint `/health`, request-id, logs estructurados.
7. **Versionado de API**
   - Activar versionado (`/api/v1`).

---

## 5) Checklist para usar este repo como template

1. Configurar `.env` (JWT, DB, CORS).
2. Ejecutar migraciones Prisma.
3. Cargar seed de roles/permisos.
4. Correr `npm run test` y `npm run test:e2e`.
5. Crear primer usuario admin.
6. Ajustar permisos por dominio del nuevo proyecto.

---

## 6) Comandos de arranque

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

