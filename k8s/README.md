# Happy School — Guía de Despliegue en Kubernetes

## Requisitos previos

Necesitas tener instalado en tu máquina:

| Herramienta | Versión mínima | Para qué sirve |
|-------------|---------------|----------------|
| Docker | 20+ | Construir las imágenes de la app |
| kubectl | 1.28+ | Controlar el cluster de Kubernetes |
| Un cluster K8s | — | Donde corre la app (minikube, k3d, kind, Docker Desktop, etc.) |

---

## Arquitectura del sistema

```
Tu browser
    │
    ▼ http://localhost:30080
[Contenedor web — nginx]
    │
    ├── /api/*     → proxy →  [Contenedor backend — Node.js :3000]
    └── /uploads/* → proxy →       │
                                   ├── /app/uploads → [PVC 2Gi - fotos y documentos]
                                   │
                                   ▼
                            [Contenedor postgres — PostgreSQL 15 :5432]
                                   │
                                   └── datos → [PVC 5Gi - base de datos]
```

**Al arrancar, el backend hace automáticamente:**
1. Espera a que PostgreSQL esté listo
2. Corre las 52 migraciones de base de datos (incluye 18 catálogos de configuración)
3. Crea los datos iniciales (directora, ciclo escolar, grupos)
4. Arranca el servidor Express

---

## Paso 1 — Configurar los secrets

Edita el archivo `k8s/secret.yaml`. Debes reemplazar los valores `CHANGE_ME_BASE64` con tus propios valores codificados en base64.

### ¿Cómo codificar un valor en base64?

Abre una terminal y ejecuta:
```bash
node -e "console.log(Buffer.from('tu-valor-aqui').toString('base64'))"
```

### Valores que necesitas generar

#### 1. Contraseña de PostgreSQL

Elige una contraseña segura, por ejemplo `MiPassword2026Segura`:
```bash
# Codificar la contraseña
node -e "console.log(Buffer.from('MiPassword2026Segura').toString('base64'))"
```

Copia el resultado en `secret.yaml` en el campo `POSTGRES_PASSWORD`.

#### 2. DATABASE_URL

La URL de conexión **debe usar exactamente** el host `happy-school-postgres` (es el nombre del Service en K8s):
```bash
node -e "console.log(Buffer.from('postgresql://happyschool:MiPassword2026Segura@happy-school-postgres:5432/happyschool').toString('base64'))"
```

Copia el resultado en el campo `DATABASE_URL`.

> **Importante:** La contraseña en `DATABASE_URL` y en `POSTGRES_PASSWORD` deben ser **la misma**.

#### 3. Secretos JWT

Genera dos cadenas largas y aleatorias (una para JWT_SECRET y otra diferente para JWT_REFRESH_SECRET):
```bash
# Generar un secreto aleatorio de 48 bytes
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Ejecuta ese comando **dos veces** para obtener dos valores diferentes. Luego codifica cada uno:
```bash
node -e "console.log(Buffer.from('EL_VALOR_GENERADO_AQUI').toString('base64'))"
```

Copia cada resultado en `JWT_SECRET` y `JWT_REFRESH_SECRET` respectivamente.

### Ejemplo de cómo debe verse secret.yaml después de llenarlo

```yaml
data:
  DATABASE_URL: cG9zdGdyZXNxbDovL2hhcHB5c2Nob29sOk1pUGFzc3dvcmQyMDI2U2VndXJhQGhhcHB5LXNjaG9vbC1wb3N0Z3Jlczpo
  POSTGRES_PASSWORD: TWlQYXNzd29yZDIwMjZTZWd1cmE=
  JWT_SECRET: YWJjZGVmZ2hpams...
  JWT_REFRESH_SECRET: enl4d3Z1dHNycXBv...
  DEFAULT_USER_PASSWORD: SGFwcHlTY2hvb2wyMDI2IQ==   # ya viene listo
  TWILIO_ACCOUNT_SID: QUNlYTc2NDljOWEzYjAw...       # ya viene listo
  TWILIO_AUTH_TOKEN: NWRhZjQ1NTdjNmJjYjJh...         # ya viene listo
  TWILIO_WHATSAPP_FROM: d2hhdHNhcHA6KzE0...          # ya viene listo
```

---

## Paso 2 — Ejecutar el deploy

Desde la carpeta raíz del proyecto:

```bash
chmod +x k8s/deploy.sh
./k8s/deploy.sh
```

El script hace todo automáticamente:
1. Construye las imágenes Docker (backend y web)
2. Las carga en tu cluster local
3. Aplica todos los manifests de Kubernetes en el orden correcto
4. Espera a que todos los pods estén listos (puede tomar 2-3 minutos la primera vez)
5. Muestra las URLs de acceso al final

### ¿Qué tipo de cluster tienes?

El script **detecta automáticamente** el tipo de cluster:
- **minikube** → usa `minikube image load`
- **k3d** → usa `k3d image import`
- **kind** → usa `kind load docker-image`
- **Docker Desktop / Rancher Desktop** → las imágenes locales ya son accesibles

---

## Paso 3 — Verificar que funciona

```bash
# Ver que los 3 pods están corriendo
kubectl get pods -n happy-school
```

Deberías ver algo así:
```
NAME                                    READY   STATUS    RESTARTS
happy-school-postgres-xxx               1/1     Running   0
happy-school-backend-xxx                1/1     Running   0
happy-school-web-xxx                    1/1     Running   0
```

```bash
# Verificar que el backend responde
curl http://localhost:30000/health
```

Respuesta esperada:
```json
{"status":"ok","app":"Happy School API","version":"1.0.0"}
```

---

## Paso 4 — Abrir la aplicación

Abre tu navegador en: **http://localhost:30080**

Inicia sesión con:
- **Email:** `directora@happyschool.edu.mx`
- **Password:** `HappySchool2026!`

---

## Datos iniciales cargados automáticamente

Al arrancar el sistema, se crean automáticamente:

**Usuarios del sistema:**
| Usuario | Email | Password |
|---------|-------|----------|
| Directora | directora@happyschool.edu.mx | HappySchool2026! |
| Administrativo | admin@happyschool.edu.mx | HappySchool2026! |
| Maestra Maternal | maternal@happyschool.edu.mx | HappySchool2026! |
| Maestra Prekinder | prekinder@happyschool.edu.mx | HappySchool2026! |
| Maestra Kinder 1A | kinder1@happyschool.edu.mx | HappySchool2026! |
| Maestra Kinder 2 | kinder2@happyschool.edu.mx | HappySchool2026! |
| Maestra Kinder 3 | kinder3@happyschool.edu.mx | HappySchool2026! |

**Catálogos de configuración (18 tipos):**
- Ánimo, cuánto comió, condición de pañal, tipos de insumo
- Intensidad de vómito, tiempos de comida, niveles educativos
- Tipos de documento, métodos de pago, conceptos de pago
- Alergias, parentesco, comportamiento, roles de personal
- Estados de alumno, checklist de entrada/salida

**Ciclo escolar:** 2025-2026

**Grupos:** Maternal, Prekinder, Kinder 1A, Kinder 1B, Kinder 2, Kinder 3

---

## Actualizar el sistema después de cambios en el código

Si se hacen cambios al código y quieres re-desplegar:

```bash
# Reconstruir todo y re-desplegar
./k8s/deploy.sh

# O solo re-desplegar sin reconstruir imágenes
./k8s/deploy.sh --no-build
kubectl rollout restart deployment/happy-school-backend -n happy-school
kubectl rollout restart deployment/happy-school-web -n happy-school
```

---

## Comandos útiles del día a día

```bash
# Ver estado de todos los pods
kubectl get pods -n happy-school

# Ver logs del backend en tiempo real
kubectl logs -n happy-school -l app=happy-school-backend -f

# Ver qué pasó durante las migraciones y seed al arrancar
kubectl logs -n happy-school -l app=happy-school-backend -c migrate-and-seed --previous

# Ver logs de nginx (web)
kubectl logs -n happy-school -l app=happy-school-web -f

# Ver logs de PostgreSQL
kubectl logs -n happy-school -l app=happy-school-postgres -f

# Reiniciar solo el backend (sin perder datos)
kubectl rollout restart deployment/happy-school-backend -n happy-school

# Ver los servicios y sus puertos
kubectl get services -n happy-school

# Conectarse directamente a PostgreSQL (para debugging)
kubectl exec -it -n happy-school \
  $(kubectl get pod -n happy-school -l app=happy-school-postgres -o name) \
  -- psql -U happyschool -d happyschool
```

---

## Solución de problemas frecuentes

### El pod del backend se queda en estado Init

```bash
# Ver qué está pasando en el initContainer
kubectl logs -n happy-school -l app=happy-school-backend -c migrate-and-seed -f
```

Causas comunes:
- **PostgreSQL no está listo aún** → normal, el script reintenta cada 3 segundos automáticamente
- **DATABASE_URL incorrecta en secret.yaml** → verificar que el host sea `happy-school-postgres`
- **Error en una migración SQL** → revisa los logs para ver cuál migración falló

### Error "ImagePullBackOff"

```bash
kubectl describe pod -n happy-school -l app=happy-school-backend
```

Significa que el cluster no encontró la imagen Docker. Soluciones:
- Volver a cargar la imagen: `minikube image load happy-school-backend:latest` (o el comando de tu cluster)
- O volver a correr `./k8s/deploy.sh`

### Los PVCs están en estado Pending (no se montan)

```bash
kubectl get pvc -n happy-school
```

Si aparece `Pending`, tu cluster no tiene un StorageClass configurado. Edita `postgres-pvc.yaml` y `uploads-pvc.yaml` y descomenta/ajusta la línea `storageClassName` según tu cluster:
- minikube: `storageClassName: standard`
- k3d/k3s: `storageClassName: local-path`
- Docker Desktop: `storageClassName: hostpath`

### El puerto 30080 o 30000 ya está en uso

Edita `k8s/web-service.yaml` y/o `k8s/backend-service.yaml` y cambia el valor de `nodePort` a otro puerto entre 30000-32767 que esté libre.

### Quiero usar un dominio en lugar de localhost:30080

1. Instala un Ingress Controller en tu cluster
2. Descomenta `- ingress.yaml` en `kustomization.yaml`
3. Edita `ingress.yaml` y cambia `happyschool.local` por tu dominio
4. Si es un dominio local, agrega a `/etc/hosts`: `127.0.0.1 happyschool.local`

---

## Eliminar todo (limpiar el cluster)

```bash
# Eliminar todos los recursos de happy-school (los PVCs y datos de BD se conservan)
kubectl delete namespace happy-school

# Para eliminar TODO incluyendo la base de datos (CUIDADO: se pierden todos los datos)
kubectl delete pvc postgres-data-pvc uploads-pvc -n happy-school
kubectl delete namespace happy-school
```

---

## Estructura de archivos de este deployment

```
k8s/
├── README.md                  ← Esta guía
├── deploy.sh                  ← Script de deploy automático
├── kustomization.yaml         ← Aplica todos los manifests en orden
├── namespace.yaml             ← Namespace "happy-school"
├── configmap.yaml             ← Variables de configuración (no sensibles)
├── secret.yaml                ← Credenciales y secrets (EDITAR ANTES DE DEPLOY)
├── postgres-pvc.yaml          ← Almacenamiento para la base de datos (5Gi)
├── uploads-pvc.yaml           ← Almacenamiento para fotos y documentos (2Gi)
├── postgres-deployment.yaml   ← Pod de PostgreSQL 15
├── postgres-service.yaml      ← Service interno para PostgreSQL
├── backend-deployment.yaml    ← Pod del backend Node.js (con initContainer)
├── backend-service.yaml       ← Service NodePort :30000 para el backend
├── web-deployment.yaml        ← Pod del frontend React + nginx
├── web-service.yaml           ← Service NodePort :30080 para la web
└── ingress.yaml               ← Ingress opcional (desactivado por default)
```
