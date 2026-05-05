# -*- coding: utf-8 -*-
# Protocolo automático de cierre de sesión
# Uso: .\cierre.ps1

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$proyectoPath = Get-Location

Write-Host "🔄 Iniciando protocolo de cierre..." -ForegroundColor Cyan

# Leer PENDIENTES.md
$pendientesPath = "$proyectoPath\PENDIENTES.md"
$archiveLogPath = "$proyectoPath\ARCHIVE_LOG.md"

if (!(Test-Path $pendientesPath)) {
    Write-Host "❌ PENDIENTES.md no encontrado" -ForegroundColor Red
    exit 1
}

$pendientesContent = [System.IO.File]::ReadAllText($pendientesPath, [System.Text.Encoding]::UTF8)
$archiveContent = [System.IO.File]::ReadAllText($archiveLogPath, [System.Text.Encoding]::UTF8)

# Detectar secciones completadas (## con emoji checkmark)
$seccionesPattern = '(^|\n)(## [✅🎉][^\n]*(?:\n(?!^##)[^\n]*)*)'
$matches = [regex]::Matches($pendientesContent, $seccionesPattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)

if ($matches.Count -eq 0) {
    Write-Host "ℹ️ No hay secciones completadas para mover" -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ Encontradas $($matches.Count) secciones completadas" -ForegroundColor Green

# Mover secciones a ARCHIVE_LOG
$seccionesAMover = @()
foreach ($match in $matches) {
    $seccion = $match.Value.Trim()
    $seccionesAMover += $seccion
    $primeraLinea = ($seccion -split [Environment]::NewLine)[0]
    Write-Host "  → Moviendo: $primeraLinea" -ForegroundColor Gray
}

# Encontrar posición de inserción en ARCHIVE_LOG (antes de BUGS HISTÓRICOS)
$bugsHistoricoPos = $archiveContent.IndexOf('## 🐛 BUGS HISTÓRICOS')
if ($bugsHistoricoPos -eq -1) {
    # Insertar al final si no existe
    $archiveContent += "`n`n" + ($seccionesAMover -join "`n`n")
} else {
    $archiveContent = $archiveContent.Insert($bugsHistoricoPos, ($seccionesAMover -join "`n`n") + "`n`n")
}

# Limpiar PENDIENTES.md
$pendientesLimpio = $pendientesContent
foreach ($seccion in $seccionesAMover) {
    $pendientesLimpio = $pendientesLimpio.Replace($seccion, "")
}

# Normalizar espacios múltiples
$pendientesLimpio = $pendientesLimpio -replace "`n{3,}", "`n`n"

# Escribir archivos con encoding UTF-8
[System.IO.File]::WriteAllText($pendientesPath, $pendientesLimpio, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($archiveLogPath, $archiveContent, [System.Text.Encoding]::UTF8)

Write-Host "✅ Archivos actualizados" -ForegroundColor Green

# Git commit
cd $proyectoPath
git add PENDIENTES.md ARCHIVE_LOG.md 2>&1 | Out-Null
$commitMsg = "chore: Cierre automático — Secciones completadas movidas a ARCHIVE_LOG"
git commit -m $commitMsg 2>&1 | Out-Null

Write-Host "✅ Commit realizado" -ForegroundColor Green
Write-Host "`n🎉 Protocolo de cierre completado" -ForegroundColor Cyan
