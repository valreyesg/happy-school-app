import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Páginas
import LoginPage from '@/pages/LoginPage';
import SplashPage from '@/pages/SplashPage';

// Layouts por rol
import DirectoraLayout from '@/layouts/DirectoraLayout';
import AdministrativoLayout from '@/layouts/AdministrativoLayout';
import MaestraLayout from '@/layouts/MaestraLayout';
import PadreLayout from '@/layouts/PadreLayout';

// Páginas de directora
import DirectoraDashboard from '@/pages/directora/Dashboard';
import DirectoraAlumnos from '@/pages/directora/Alumnos';
import DirectoraNinosExtension from '@/pages/directora/NinosExtension';
import DirectoraVisitantes from '@/pages/directora/Visitantes';
import DirectoraGrupos from '@/pages/directora/Grupos';
import DirectoraPersonal from '@/pages/directora/Personal';
import DirectoraPagos from '@/pages/directora/Pagos';
import DirectoraCalendario from '@/pages/directora/Calendario';
import DirectoraEvaluaciones from '@/pages/directora/Evaluaciones';
import DirectoraConfig from '@/pages/directora/Configuracion';
import DirectoraAlumnoPerfil from '@/pages/directora/AlumnoPerfil';
import DirectoraAsistencia from '@/pages/directora/Asistencia';
import DirectoraBitacora from '@/pages/directora/Bitacora';
import DirectoraTurnoPuerta from '@/pages/directora/TurnoPuerta';
import DirectoraServicioComida from '@/pages/directora/ServicioComida';
import DirectoraComidaMenu from '@/pages/directora/ComidaMenu';
import DirectoraComidaPagos from '@/pages/directora/ComidaPagos';
import DirectoraCiclos from '@/pages/directora/CiclosEscolares';
import DirectoraAvisoExtraordinario from '@/pages/directora/AvisoExtraordinario';

// Páginas de administrativo
import AdminDashboard from '@/pages/administrativo/Dashboard';
import AdminPagos from '@/pages/administrativo/Pagos';
import AdminInscripciones from '@/pages/administrativo/Inscripciones';

// Páginas de maestra
import MaestraDashboard from '@/pages/maestra/Dashboard';
import MaestraAsistencia from '@/pages/maestra/Asistencia';
import MaestraFiltroEntrada from '@/pages/maestra/FiltroEntrada';
import MaestraFiltroSalida from '@/pages/maestra/FiltroSalida';
import MaestraBitacora from '@/pages/maestra/Bitacora';
import MaestraGaleria from '@/pages/maestra/Galeria';
import MaestraTareas from '@/pages/maestra/Tareas';

// Páginas de padre
import PadreDashboard from '@/pages/padre/Dashboard';
import PadreBitacora from '@/pages/padre/Bitacora';
import PadrePagos from '@/pages/padre/Pagos';
import PadreCalendario from '@/pages/padre/Calendario';
import PadreComidaSemanal from '@/pages/padre/ComidaSemanal';

// Guard de autenticación
const PrivateRoute = ({ element, rolesPermitidos }) => {
  const { usuario, token } = useAuthStore();
  if (!token || !usuario) return <Navigate to="/login" replace />;
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rolPrincipal)) {
    return <Navigate to="/" replace />;
  }
  return element;
};

// Redirección por rol al iniciar sesión
const RoleRedirect = () => {
  const { usuario } = useAuthStore();
  if (!usuario) return <Navigate to="/login" replace />;

  const redirects = {
    directora: '/directora',
    administrativo: '/admin',
    maestra_titular: '/maestra',
    maestra_especial: '/maestra',
    maestra_puerta: '/maestra',
    padre: '/padre',
  };
  return <Navigate to={redirects[usuario.rolPrincipal] || '/login'} replace />;
};

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/splash" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Directora */}
      <Route path="/directora" element={
        <PrivateRoute
          element={<DirectoraLayout />}
          rolesPermitidos={['directora']}
        />
      }>
        <Route index element={<DirectoraDashboard />} />
        <Route path="alumnos" element={<DirectoraAlumnos />} />
        <Route path="alumnos/:id" element={<DirectoraAlumnoPerfil />} />
        <Route path="ninos-extension" element={<DirectoraNinosExtension />} />
        <Route path="visitantes" element={<DirectoraVisitantes />} />
        <Route path="asistencia" element={<DirectoraAsistencia />} />
        <Route path="bitacora" element={<DirectoraBitacora />} />
        <Route path="grupos" element={<DirectoraGrupos />} />
        <Route path="personal" element={<DirectoraPersonal />} />
        <Route path="pagos" element={<DirectoraPagos />} />
        <Route path="calendario" element={<DirectoraCalendario />} />
        <Route path="evaluaciones" element={<DirectoraEvaluaciones />} />
        <Route path="config" element={<DirectoraConfig />} />
        <Route path="turno-puerta" element={<DirectoraTurnoPuerta />} />
        <Route path="comida" element={<DirectoraServicioComida />} />
        <Route path="comida-menu" element={<Navigate to="/directora/comida" replace />} />
        <Route path="comida-pagos" element={<Navigate to="/directora/comida" replace />} />
        <Route path="ciclos" element={<DirectoraCiclos />} />
        <Route path="aviso" element={<DirectoraAvisoExtraordinario />} />
      </Route>

      {/* Administrativo */}
      <Route path="/admin" element={
        <PrivateRoute
          element={<AdministrativoLayout />}
          rolesPermitidos={['administrativo', 'directora']}
        />
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="pagos" element={<AdminPagos />} />
        <Route path="inscripciones" element={<AdminInscripciones />} />
        <Route path="comida-pagos" element={<DirectoraComidaPagos />} />
      </Route>

      {/* Maestra */}
      <Route path="/maestra" element={
        <PrivateRoute
          element={<MaestraLayout />}
          rolesPermitidos={['maestra_titular', 'maestra_especial', 'maestra_puerta', 'directora']}
        />
      }>
        <Route index element={<MaestraDashboard />} />
        <Route path="filtro-entrada" element={<MaestraFiltroEntrada />} />
        <Route path="filtro-salida" element={<MaestraFiltroSalida />} />
        <Route path="asistencia" element={<MaestraAsistencia />} />
        <Route path="bitacora" element={<MaestraBitacora />} />
        <Route path="galeria" element={<MaestraGaleria />} />
        <Route path="tareas" element={<MaestraTareas />} />
      </Route>

      {/* Padre */}
      <Route path="/padre" element={
        <PrivateRoute
          element={<PadreLayout />}
          rolesPermitidos={['padre']}
        />
      }>
        <Route index element={<PadreDashboard />} />
        <Route path="bitacora" element={<PadreBitacora />} />
        <Route path="pagos" element={<PadrePagos />} />
        <Route path="calendario" element={<PadreCalendario />} />
        <Route path="comida" element={<PadreComidaSemanal />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
