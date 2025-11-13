# CI/CD Pipeline Documentation

Este proyecto utiliza GitHub Actions para automatizar builds, tests, security checks y releases.

## 📋 Workflows Configurados

### 1. CI (Continuous Integration) - `ci.yml`

**Trigger:** Push y Pull Requests a `main`, `master`, `develop`

**Jobs:**
- **Lint**: Ejecuta ESLint y verifica formato del código
- **Build**: Compila TypeScript y genera artefactos
- **Test**: Ejecuta tests en Node.js 18, 20 y 22
- **Security**: Ejecuta npm audit para detectar vulnerabilidades
- **TypeCheck**: Verifica tipos de TypeScript
- **All Checks**: Valida que todos los checks anteriores pasaron

**Estado:** [![CI](https://github.com/esbozos/nodejs-nets-core/actions/workflows/ci.yml/badge.svg)](https://github.com/esbozos/nodejs-nets-core/actions/workflows/ci.yml)

### 2. Release & Publish - `release.yml`

**Trigger:** Push de tags con formato `v*.*.*` (ej: `v1.0.0`)

**Jobs:**
1. **Validate**: Ejecuta lint, tests y build
2. **Publish to npm**: Publica el paquete en npm
3. **Create Release**: Crea GitHub Release con changelog
4. **Notify**: Notifica éxito de la publicación

**Cómo crear un release:**

```bash
# 1. Actualizar versión en package.json
npm version patch  # o minor, o major

# 2. Push del tag (esto dispara el workflow)
git push origin master --tags

# 3. El workflow automáticamente:
#    - Valida el código
#    - Publica en npm
#    - Crea GitHub Release
```

### 3. CodeQL Security - `codeql.yml`

**Trigger:**
- Push y PR a `main`, `master`, `develop`
- Schedule: Cada lunes a las 00:00 UTC

**Funcionalidad:**
- Análisis estático de seguridad
- Detección de vulnerabilidades
- Escaneo de calidad de código

### 4. Dependabot - `dependabot.yml`

**Funcionalidad:**
- Actualiza dependencias npm semanalmente (lunes 09:00)
- Agrupa actualizaciones por tipo
- Actualiza GitHub Actions mensualmente
- Crea PRs automáticos con actualizaciones

## 🔐 Secrets Requeridos

Para que los workflows funcionen correctamente, configura estos secrets en GitHub:

### NPM_TOKEN
**Ubicación:** Settings → Secrets and variables → Actions → New repository secret

**Cómo obtenerlo:**
1. Ir a https://www.npmjs.com/
2. Login → Account → Access Tokens
3. Generate New Token → Automation
4. Copiar el token
5. Agregar como secret `NPM_TOKEN` en GitHub

**Verificación:**
```bash
# El token ya está en tu entorno como NPM_TOKEN
echo $NPM_TOKEN
```

### GITHUB_TOKEN
Este token es proporcionado automáticamente por GitHub Actions, no necesitas configurarlo.

## 🚀 Flujo de Trabajo Completo

### Para desarrollo diario:

```bash
# 1. Crear rama feature
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios y commits
git add .
git commit -m "feat: nueva funcionalidad"

# 3. Push y crear PR
git push origin feature/nueva-funcionalidad

# 4. El workflow CI se ejecuta automáticamente
#    - Verifica lint
#    - Ejecuta build
#    - Corre tests
#    - Escanea seguridad
```

### Para releases:

```bash
# 1. Asegúrate de estar en master y actualizado
git checkout master
git pull origin master

# 2. Actualizar CHANGELOG.md con los cambios

# 3. Crear versión (actualiza package.json y crea tag)
npm version patch   # 1.0.0 -> 1.0.1
# o
npm version minor   # 1.0.1 -> 1.1.0
# o
npm version major   # 1.1.0 -> 2.0.0

# 4. Push con tags
git push origin master --tags

# 5. El workflow release.yml automáticamente:
#    ✅ Valida código (lint + test + build)
#    ✅ Publica en npm con acceso público
#    ✅ Crea GitHub Release con changelog
#    ✅ Notifica éxito
```

## 📊 Badges Disponibles

Añade estos badges a tu README:

```markdown
[![npm version](https://img.shields.io/npm/v/@meregy/nodejs-nets-core.svg)](https://www.npmjs.com/package/@meregy/nodejs-nets-core)
[![CI](https://github.com/esbozos/nodejs-nets-core/actions/workflows/ci.yml/badge.svg)](https://github.com/esbozos/nodejs-nets-core/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@meregy/nodejs-nets-core.svg)](https://nodejs.org)
[![npm downloads](https://img.shields.io/npm/dm/@meregy/nodejs-nets-core.svg)](https://www.npmjs.com/package/@meregy/nodejs-nets-core)
```

## 🔧 Configuración Avanzada

### Cambiar frecuencia de Dependabot

Edita `.github/dependabot.yml`:

```yaml
schedule:
  interval: "daily"  # o "weekly", "monthly"
```

### Agregar más versiones de Node.js al CI

Edita `.github/workflows/ci.yml`:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22, 23]  # Agregar versiones
```

### Modificar reglas de npm audit

Edita `.github/workflows/ci.yml`:

```yaml
- name: Check for vulnerabilities
  run: npm audit --audit-level=critical  # o moderate, high
```

## 🐛 Troubleshooting

### El workflow de release falla con 404

**Problema:** Organización npm no existe o no tienes permisos

**Solución:**
1. Verifica que seas owner de @meregy: `npm org ls meregy`
2. Verifica que NPM_TOKEN tenga permisos de Automation
3. Verifica que `publishConfig.access: "public"` esté en package.json

### Tests fallan en CI pero pasan localmente

**Problema:** Diferencias de entorno o versiones

**Solución:**
1. Verifica versión de Node.js: `node --version`
2. Limpia cache: `npm ci` en lugar de `npm install`
3. Revisa variables de entorno necesarias

### Dependabot crea demasiados PRs

**Solución:**
Edita `.github/dependabot.yml`:

```yaml
open-pull-requests-limit: 5  # Reducir límite
```

O agrupa más actualizaciones:

```yaml
groups:
  all-dependencies:
    patterns:
      - "*"
    update-types:
      - "minor"
      - "patch"
```

## 📚 Referencias

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
