#!/usr/bin/env bash
# ============================================================
# deploy.sh — Happy School K8s Deployment Script
#
# Uso:
#   ./k8s/deploy.sh              # Build completo + deploy
#   ./k8s/deploy.sh --no-build   # Deploy sin reconstruir imágenes
#   ./k8s/deploy.sh --help       # Mostrar ayuda
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
info()  { echo -e "${CYAN}[INFO]${NC}   $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}   $*"; }
error() { echo -e "${RED}[ERROR]${NC}  $*" >&2; exit 1; }

# Procesar argumentos
BUILD=true
for arg in "$@"; do
  case $arg in
    --no-build) BUILD=false ;;
    --help)
      echo "Uso: ./k8s/deploy.sh [--no-build] [--help]"
      echo ""
      echo "  (sin flags)    Build de imágenes Docker + deploy a K8s"
      echo "  --no-build     Solo deploy, sin reconstruir imágenes"
      echo "  --help         Mostrar esta ayuda"
      exit 0
      ;;
  esac
done

echo ""
echo "=================================================="
echo "   Happy School — Kubernetes Deployment"
echo "=================================================="
echo ""

# ── Verificar prerequisitos ───────────────────────────────────
command -v kubectl >/dev/null 2>&1 || error "kubectl no encontrado. Instálalo primero."
command -v docker  >/dev/null 2>&1 || error "docker no encontrado. Instálalo primero."

KUBE_CONTEXT=$(kubectl config current-context 2>/dev/null || echo "ninguno")
info "Cluster K8s actual: $KUBE_CONTEXT"
echo ""
warn "Este script desplegará en el contexto actual de kubectl."
read -p "¿Continuar? [s/N] " -n 1 -r REPLY
echo ""
[[ $REPLY =~ ^[SsYy]$ ]] || { echo "Cancelado."; exit 0; }
echo ""

# ── Verificar que secret.yaml está configurado ────────────────
log "Verificando que los secrets están configurados..."
if grep -q "CHANGE_ME_BASE64" "$SCRIPT_DIR/secret.yaml" 2>/dev/null; then
  echo ""
  error "El archivo k8s/secret.yaml aún tiene valores CHANGE_ME_BASE64 sin llenar.

Antes de continuar, edita k8s/secret.yaml y llena:
  - DATABASE_URL  (connection string de PostgreSQL en base64)
  - POSTGRES_PASSWORD  (contraseña de PostgreSQL en base64)
  - JWT_SECRET  (cadena aleatoria larga en base64)
  - JWT_REFRESH_SECRET  (otra cadena aleatoria diferente en base64)

Para generar un valor en base64:
  node -e \"console.log(Buffer.from('tu-valor').toString('base64'))\"

Para generar secretos JWT:
  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"
  (luego codifica el resultado en base64)

Ver k8s/README.md para instrucciones detalladas."
fi
log "Secrets verificados."
echo ""

# ── Build de imágenes Docker ──────────────────────────────────
if [ "$BUILD" = true ]; then
  log "Construyendo imagen del backend..."
  docker build \
    -t happy-school-backend:latest \
    -f "$ROOT_DIR/backend/Dockerfile" \
    "$ROOT_DIR/backend"
  log "Backend listo."
  echo ""

  log "Construyendo imagen del web (Vite build + nginx)..."
  # VITE_API_URL=/api → relativa, nginx en este contenedor hace el proxy
  docker build \
    -t happy-school-web:latest \
    --build-arg VITE_API_URL=/api \
    -f "$ROOT_DIR/web/Dockerfile" \
    "$ROOT_DIR/web"
  log "Web listo."
  echo ""

  info "Imágenes creadas:"
  docker images | grep "happy-school" || true
  echo ""

  # ── Cargar imágenes al cluster ────────────────────────────────
  log "Cargando imágenes al cluster (imagePullPolicy: Never)..."
  if echo "$KUBE_CONTEXT" | grep -qi "minikube"; then
    info "Detectado: minikube"
    minikube image load happy-school-backend:latest
    minikube image load happy-school-web:latest
    log "Imágenes cargadas en minikube."

  elif echo "$KUBE_CONTEXT" | grep -qi "k3d"; then
    info "Detectado: k3d"
    K3D_CLUSTER=$(echo "$KUBE_CONTEXT" | sed 's/k3d-//')
    k3d image import happy-school-backend:latest happy-school-web:latest -c "$K3D_CLUSTER"
    log "Imágenes cargadas en k3d."

  elif echo "$KUBE_CONTEXT" | grep -qi "kind"; then
    info "Detectado: kind"
    kind load docker-image happy-school-backend:latest
    kind load docker-image happy-school-web:latest
    log "Imágenes cargadas en kind."

  elif echo "$KUBE_CONTEXT" | grep -qi "docker-desktop\|rancher-desktop"; then
    info "Detectado: Docker Desktop / Rancher Desktop"
    info "Las imágenes locales de Docker son accesibles directamente. Sin acción extra."

  else
    warn "Tipo de cluster no reconocido: $KUBE_CONTEXT"
    warn "Si usas un registry privado:"
    warn "  docker tag happy-school-backend:latest tu-registry/happy-school-backend:latest"
    warn "  docker push tu-registry/happy-school-backend:latest"
    warn "Y cambia imagePullPolicy: Never → IfNotPresent en los deployment yamls."
    echo ""
    read -p "¿Continuar de todas formas? [s/N] " -n 1 -r REPLY2
    echo ""
    [[ $REPLY2 =~ ^[SsYy]$ ]] || { echo "Cancelado."; exit 0; }
  fi
  echo ""
fi

# ── Aplicar manifests de Kubernetes ──────────────────────────
log "Aplicando manifests de Kubernetes..."
kubectl apply -k "$SCRIPT_DIR"
echo ""

# ── Esperar a que los deployments estén listos ────────────────
log "Esperando a que PostgreSQL esté listo..."
kubectl rollout status deployment/happy-school-postgres \
  -n happy-school \
  --timeout=120s

echo ""
log "Esperando a que el backend esté listo..."
info "(Incluye initContainer: migraciones + seed — puede tomar hasta 2 minutos)"
kubectl rollout status deployment/happy-school-backend \
  -n happy-school \
  --timeout=300s

echo ""
log "Esperando a que la web esté lista..."
kubectl rollout status deployment/happy-school-web \
  -n happy-school \
  --timeout=60s

# ── Resumen final ─────────────────────────────────────────────
echo ""
echo "=================================================="
log "DEPLOYMENT COMPLETADO"
echo "=================================================="
echo ""
kubectl get pods -n happy-school
echo ""
kubectl get services -n happy-school
echo ""

BACKEND_PORT=$(kubectl get svc happy-school-backend -n happy-school \
  -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "30000")
WEB_PORT=$(kubectl get svc happy-school-web -n happy-school \
  -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "30080")

echo -e "${GREEN}URLs de acceso:${NC}"
echo "  Web UI:        http://localhost:${WEB_PORT}"
echo "  Backend API:   http://localhost:${BACKEND_PORT}"
echo "  Health check:  http://localhost:${BACKEND_PORT}/health"
echo ""
echo -e "${GREEN}Credenciales de acceso:${NC}"
echo "  Email:     directora@happyschool.edu.mx"
echo "  Password:  HappySchool2026!"
echo ""
echo -e "${CYAN}Comandos útiles:${NC}"
echo "  Ver logs del backend:       kubectl logs -n happy-school -l app=happy-school-backend -f"
echo "  Ver logs de migraciones:    kubectl logs -n happy-school -l app=happy-school-backend -c migrate-and-seed --previous"
echo "  Estado de pods:             kubectl get pods -n happy-school"
echo "  Reiniciar backend:          kubectl rollout restart deployment/happy-school-backend -n happy-school"
echo ""
