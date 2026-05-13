#!/bin/bash
# =============================================================
# Script para crear la versión BIGAR de la app de compras
# Uso: bash setup-bigar.sh
# =============================================================

SOURCE="$(cd "$(dirname "$0")" && pwd)"
DEST="$(dirname "$SOURCE")/App-bigar"

echo "================================================"
echo "  Creando App-bigar desde App-compras..."
echo "================================================"

# 1. Copiar proyecto
if [ -d "$DEST" ]; then
  echo "⚠  La carpeta $DEST ya existe. Borrándola..."
  rm -rf "$DEST"
fi
cp -r "$SOURCE" "$DEST"
echo "✓ Proyecto copiado a $DEST"

# 2. Limpiar lo que no se necesita
rm -rf "$DEST/node_modules" "$DEST/dist" "$DEST/.git"
echo "✓ node_modules y dist eliminados"

# Función para reemplazar texto en archivos
replace() {
  local from="$1"
  local to="$2"
  local dir="$3"
  grep -rl --include="*.tsx" --include="*.ts" --include="*.json" "$from" "$dir" | \
    xargs sed -i "s|$from|$to|g" 2>/dev/null
}

echo ""
echo "Aplicando cambios de marca y región..."

# --- Nombre de la empresa ---
replace "Jugos del Uruguay S.A." "Bigar S.A." "$DEST/src"
replace "Jugos del Uruguay" "Bigar" "$DEST/src"

# --- Emails ---
replace "jugos.com.uy" "bigar.com.ar" "$DEST/src"

# --- Claves de localStorage ---
replace "jugos-cotizaciones" "bigar-cotizaciones" "$DEST/src"
replace "jugos-cuentas" "bigar-cuentas" "$DEST/src"
replace "jugos-stock" "bigar-stock" "$DEST/src"
replace "jugos-session" "bigar-session" "$DEST/src"

# --- Locale: Uruguay → Argentina ---
replace "es-UY" "es-AR" "$DEST/src"

# --- Moneda: UYU → ARS ---
replace "UYU — Peso uruguayo" "ARS — Peso argentino" "$DEST/src"
replace "Peso uruguayo" "Peso argentino" "$DEST/src"

# Tipo de cambio default: 42 (USD/UYU) → 1000 (USD/ARS)
replace "TC_DEFAULT_USD_UYU = 42" "TC_DEFAULT_USD_ARS = 1000" "$DEST/src"
replace "useState(42)" "useState(1000)" "$DEST/src"

# Variables tcUSDUYU → tcUSDARS (minúscula y mayúscula)
replace "tcUSDUYU" "tcUSDARS" "$DEST/src"
replace "TcUSDUYU" "TcUSDARS" "$DEST/src"
replace "TC_DEFAULT_USD_UYU" "TC_DEFAULT_USD_ARS" "$DEST/src"

# Lógica de conversión: 'UYU' → 'ARS' (en contextos de conversión)
replace "moneda: 'UYU'" "moneda: 'ARS'" "$DEST/src"
replace "desde === 'UYU'" "desde === 'ARS'" "$DEST/src"
replace "moneda === 'UYU'" "moneda === 'ARS'" "$DEST/src"
replace "c.moneda === 'UYU'" "c.moneda === 'ARS'" "$DEST/src"

# Etiqueta del tipo de cambio
replace "Tipo de cambio USD → UYU:" "Tipo de cambio USD → ARS:" "$DEST/src"
replace "\$/U\$S" "\$/USD" "$DEST/src"

# Option value="UYU" con label ARS → cambiar el value también
replace 'value="UYU">ARS — Peso argentino' 'value="ARS">ARS — Peso argentino' "$DEST/src"

# Texto de conversión en formularios (el span que dice "UYU" al final del input de TC)
replace ">UYU</span>" ">ARS</span>" "$DEST/src"

# Moneda en formatMonto de facturas
replace "formatMonto(totalEstimado \* tcUSDARS, 'UYU')" "formatMonto(totalEstimado * tcUSDARS, 'ARS')" "$DEST/src"
replace "formatMonto(totalEstimado \* tcUSDARS, 'UYU')" "formatMonto(totalEstimado * tcUSDARS, 'ARS')" "$DEST/src"

# --- Nombre del paquete ---
sed -i 's/"name": "app-compras"/"name": "app-bigar"/' "$DEST/package.json"

echo "✓ Todos los reemplazos aplicados"
echo ""

# 3. Instalar dependencias
echo "Instalando dependencias (puede tardar 1-2 minutos)..."
cd "$DEST"
npm install --silent
echo "✓ Dependencias instaladas"

# 4. Build
echo "Compilando la app..."
npm run build 2>&1 | tail -5

echo ""
echo "================================================"
echo "  ¡App de Bigar creada con éxito!"
echo "================================================"
echo ""
echo "Carpeta: $DEST"
echo ""
echo "Para probarla localmente:"
echo "  cd $DEST && npm run dev"
echo ""
echo "Para publicar en GitHub Pages:"
echo "  1. Creá un repositorio en GitHub (ej: app-bigar)"
echo "  2. cd $DEST"
echo "  3. git init && git add -A && git commit -m 'init'"
echo "  4. git remote add origin https://github.com/TU_USUARIO/app-bigar.git"
echo "  5. git push -u origin main"
echo "  6. En GitHub: Settings → Pages → Deploy from branch → gh-pages"
echo ""
