#!/bin/bash
# =============================================================
# Script para crear una app de compras personalizada
# Uso: bash crear-app-empresa.sh
# Requiere: Node.js instalado
# =============================================================

SOURCE="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║      Generador de App de Compras Empresarial     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ---------- Datos de la empresa ----------
read -p "► Nombre de la empresa (ej: Bigar S.A.): " EMPRESA
if [ -z "$EMPRESA" ]; then
  echo "❌ El nombre de la empresa es obligatorio."
  exit 1
fi

read -p "► Nombre corto / sin S.A. (ej: Bigar): " EMPRESA_CORTA
if [ -z "$EMPRESA_CORTA" ]; then
  EMPRESA_CORTA="$EMPRESA"
fi

read -p "► Dominio de email (ej: bigar.com.ar): " DOMINIO
if [ -z "$DOMINIO" ]; then
  echo "❌ El dominio de email es obligatorio."
  exit 1
fi

# ---------- País / Moneda ----------
echo ""
echo "► Seleccioná el país / moneda local:"
echo "  1) Argentina  — ARS (Peso argentino), TC referencia: 1000 USD"
echo "  2) Uruguay    — UYU (Peso uruguayo),  TC referencia: 42 USD"
echo "  3) Otro       — ingresar manualmente"
read -p "  Opción [1/2/3]: " PAIS_OPT

case "$PAIS_OPT" in
  1)
    MONEDA_CODIGO="ARS"
    MONEDA_LABEL="Peso argentino"
    TC_DEFAULT=1000
    LOCALE="es-AR"
    ;;
  2)
    MONEDA_CODIGO="UYU"
    MONEDA_LABEL="Peso uruguayo"
    TC_DEFAULT=42
    LOCALE="es-UY"
    ;;
  3)
    read -p "► Código de moneda (ej: CLP, PEN, COP): " MONEDA_CODIGO
    read -p "► Nombre de la moneda (ej: Peso chileno): " MONEDA_LABEL
    read -p "► Tipo de cambio USD → $MONEDA_CODIGO (ej: 950): " TC_DEFAULT
    read -p "► Locale (ej: es-CL, es-PE): " LOCALE
    ;;
  *)
    echo "❌ Opción inválida."
    exit 1
    ;;
esac

# ---------- Carpeta destino ----------
NOMBRE_CARPETA=$(echo "$EMPRESA_CORTA" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
DEST="$(dirname "$SOURCE")/App-${NOMBRE_CARPETA}"

echo ""
echo "► Resumen:"
echo "   Empresa:    $EMPRESA"
echo "   Email:      usuario@$DOMINIO"
echo "   Moneda:     $MONEDA_CODIGO ($MONEDA_LABEL)"
echo "   TC base:    1 USD = $TC_DEFAULT $MONEDA_CODIGO"
echo "   Carpeta:    $DEST"
echo ""
read -p "¿Continuar? [S/n]: " CONFIRM
if [[ "$CONFIRM" =~ ^[Nn]$ ]]; then
  echo "Cancelado."
  exit 0
fi

# ---------- Copiar proyecto ----------
if [ -d "$DEST" ]; then
  echo ""
  read -p "⚠  La carpeta '$DEST' ya existe. ¿Sobreescribir? [s/N]: " OW
  if [[ ! "$OW" =~ ^[Ss]$ ]]; then
    echo "Cancelado."
    exit 0
  fi
  rm -rf "$DEST"
fi

echo ""
echo "Copiando proyecto..."
cp -r "$SOURCE" "$DEST"
rm -rf "$DEST/node_modules" "$DEST/dist" "$DEST/.git"
echo "✓ Proyecto copiado"

# ---------- Función de reemplazo ----------
replace() {
  local from="$1"
  local to="$2"
  grep -rl --include="*.tsx" --include="*.ts" --include="*.json" "$from" "$DEST/src" 2>/dev/null | \
    xargs -I{} sed -i "s|$from|$to|g" {} 2>/dev/null
}

echo "Aplicando personalización..."

# Nombre empresa
replace "Jugos del Uruguay S.A." "$EMPRESA"
replace "Jugos del Uruguay" "$EMPRESA_CORTA"
replace "Bigar S.A." "$EMPRESA"
replace "Bigar" "$EMPRESA_CORTA"

# Emails
replace "jugos.com.uy" "$DOMINIO"
replace "bigar.com.ar" "$DOMINIO"

# Claves localStorage
CLAVE=$(echo "$NOMBRE_CARPETA" | tr '-' '')
replace "jugos-cotizaciones" "${CLAVE}-cotizaciones"
replace "jugos-cuentas" "${CLAVE}-cuentas"
replace "jugos-stock" "${CLAVE}-stock"
replace "jugos-session" "${CLAVE}-session"
replace "bigar-cotizaciones" "${CLAVE}-cotizaciones"
replace "bigar-cuentas" "${CLAVE}-cuentas"
replace "bigar-stock" "${CLAVE}-stock"
replace "bigar-session" "${CLAVE}-session"

# Locale
replace "es-UY" "$LOCALE"
replace "es-AR" "$LOCALE"

# Moneda local
replace "UYU — Peso uruguayo" "${MONEDA_CODIGO} — ${MONEDA_LABEL}"
replace "ARS — Peso argentino" "${MONEDA_CODIGO} — ${MONEDA_LABEL}"
replace "Peso uruguayo" "$MONEDA_LABEL"
replace "Peso argentino" "$MONEDA_LABEL"

# Tipo de cambio default
replace "TC_DEFAULT_USD_UYU = 42" "TC_DEFAULT_USD_LOCAL = $TC_DEFAULT"
replace "TC_DEFAULT_USD_ARS = 1000" "TC_DEFAULT_USD_LOCAL = $TC_DEFAULT"
replace "TC_DEFAULT_USD_UYU" "TC_DEFAULT_USD_LOCAL"
replace "TC_DEFAULT_USD_ARS" "TC_DEFAULT_USD_LOCAL"
replace "useState(42)" "useState($TC_DEFAULT)"
replace "useState(1000)" "useState($TC_DEFAULT)"

# Variables internas
replace "tcUSDUYU" "tcUSDLocal"
replace "TcUSDUYU" "TcUSDLocal"
replace "tcUSDARS" "tcUSDLocal"
replace "TcUSDARS" "TcUSDLocal"

# Lógica de conversión
replace "moneda: 'UYU'" "moneda: '${MONEDA_CODIGO}'"
replace "moneda: 'ARS'" "moneda: '${MONEDA_CODIGO}'"
replace "desde === 'UYU'" "desde === '${MONEDA_CODIGO}'"
replace "desde === 'ARS'" "desde === '${MONEDA_CODIGO}'"
replace "moneda === 'UYU'" "moneda === '${MONEDA_CODIGO}'"
replace "moneda === 'ARS'" "moneda === '${MONEDA_CODIGO}'"
replace "c.moneda === 'UYU'" "c.moneda === '${MONEDA_CODIGO}'"
replace "c.moneda === 'ARS'" "c.moneda === '${MONEDA_CODIGO}'"

# Etiquetas de tipo de cambio
replace "Tipo de cambio USD → UYU:" "Tipo de cambio USD → ${MONEDA_CODIGO}:"
replace "Tipo de cambio USD → ARS:" "Tipo de cambio USD → ${MONEDA_CODIGO}:"
replace '$/U$S' '$/USD'
replace ">UYU</span>" ">${MONEDA_CODIGO}</span>"
replace ">ARS</span>" ">${MONEDA_CODIGO}</span>"

# Conversión en FacturaForm
replace "formatMonto(totalEstimado \* tcUSDLocal, 'UYU')" "formatMonto(totalEstimado * tcUSDLocal, '${MONEDA_CODIGO}')"
replace "formatMonto(totalEstimado \* tcUSDLocal, 'ARS')" "formatMonto(totalEstimado * tcUSDLocal, '${MONEDA_CODIGO}')"

# Option value en selects de moneda
replace 'value="UYU">'"${MONEDA_CODIGO} — ${MONEDA_LABEL}" 'value="'"${MONEDA_CODIGO}"'">'"${MONEDA_CODIGO} — ${MONEDA_LABEL}"
replace 'value="ARS">'"${MONEDA_CODIGO} — ${MONEDA_LABEL}" 'value="'"${MONEDA_CODIGO}"'">'"${MONEDA_CODIGO} — ${MONEDA_LABEL}"

# Nombre del paquete
sed -i "s|\"name\": \"app-compras\"|\"name\": \"app-${NOMBRE_CARPETA}\"|" "$DEST/package.json" 2>/dev/null
sed -i "s|\"name\": \"app-bigar\"|\"name\": \"app-${NOMBRE_CARPETA}\"|" "$DEST/package.json" 2>/dev/null

echo "✓ Personalización aplicada"

# ---------- Instalar y compilar ----------
echo "Instalando dependencias..."
cd "$DEST"
npm install --silent 2>/dev/null
echo "✓ Dependencias instaladas"

echo "Compilando..."
npm run build 2>&1 | grep -E "error|✓ built|Error"
echo ""

echo "╔══════════════════════════════════════════════════╗"
echo "║  ✓ App de '$EMPRESA_CORTA' lista                 "
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Carpeta: $DEST"
echo ""
echo "  Para probarla localmente:"
echo "    cd \"$DEST\" && npm run dev"
echo ""
echo "  Para publicar online (GitHub Pages):"
echo "    1. Crear repositorio en github.com"
echo "    2. cd \"$DEST\""
echo "    3. git init && git add -A && git commit -m 'init'"
echo "    4. git remote add origin https://github.com/USUARIO/REPOSITORIO.git"
echo "    5. git push -u origin main"
echo "    6. GitHub → Settings → Pages → Deploy from branch → main"
echo ""
