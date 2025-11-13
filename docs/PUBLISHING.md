# Publishing Guide - nodejs-nets-core

Este documento explica cómo publicar nuevas versiones de `nodejs-nets-core` en npm.

## 📋 Prerequisitos

1. **Cuenta npm**: Necesitas tener una cuenta en [npmjs.com](https://www.npmjs.com/)
2. **Login**: Ejecuta `npm login` y ingresa tus credenciales
3. **Permisos**: Debes tener permisos de publicación en el paquete (owner/maintainer)
4. **Git limpio**: Todos los cambios deben estar commiteados

## 🎯 Semantic Versioning

Usamos [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): Nuevas features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

## 🚀 Proceso de Release

### Opción 1: Script Automatizado (Recomendado)

```bash
# Ver versión actual y sugerencias
npm run version:check

# Release patch (bug fixes)
npm run release:patch
# o
./scripts/release.sh patch

# Release minor (new features)
npm run release:minor
# o
./scripts/release.sh minor

# Release major (breaking changes)
npm run release:major
# o
./scripts/release.sh major
```

El script automatizado:
1. ✅ Valida el entorno
2. ✅ Ejecuta tests
3. ✅ Ejecuta linter
4. ✅ Limpia y compila el proyecto
5. ✅ Incrementa la versión
6. ✅ Actualiza CHANGELOG.md
7. ✅ Crea commit y tag de git
8. ✅ Publica en npm
9. ✅ Push a git repository

### Opción 2: Manual con npm

```bash
# 1. Asegúrate de que todo está commiteado
git status

# 2. Ejecutar tests
npm test

# 3. Compilar
npm run build

# 4. Incrementar versión
npm version patch  # o minor, major
# Esto actualiza package.json y crea un commit + tag

# 5. Publicar
npm publish --access public

# 6. Push a git
git push origin master --tags
```

## 🧪 Pre-releases (Beta/Alpha)

Para publicar versiones de prueba:

```bash
# Publicar beta
npm run release:beta
# o
./scripts/publish-beta.sh beta

# Publicar alpha
./scripts/publish-beta.sh alpha

# Publicar release candidate
./scripts/publish-beta.sh rc
```

Los usuarios pueden instalar con:
```bash
npm install nodejs-nets-core@beta
npm install nodejs-nets-core@alpha
npm install nodejs-nets-core@rc
```

## 📝 Actualizar CHANGELOG

Antes de cada release, actualiza `CHANGELOG.md` con:

```markdown
## [1.2.3] - 2024-11-12

### Added
- Nueva funcionalidad X
- Soporte para Y

### Changed
- Mejorado rendimiento de Z
- Actualizada dependencia W

### Fixed
- Corregido bug en A
- Solucionado problema con B

### Deprecated
- Función X será removida en v2.0.0

### Security
- Actualizada dependencia con vulnerabilidad
```

## 🔍 Verificar Publicación

Después de publicar:

```bash
# Ver info del paquete
npm info nodejs-nets-core

# Ver versión publicada
npm view nodejs-nets-core version

# Ver todas las versiones
npm view nodejs-nets-core versions

# Probar instalación
cd /tmp
mkdir test-install
cd test-install
npm init -y
npm install nodejs-nets-core
node -e "console.log(require('nodejs-nets-core'))"
```

## 🛡️ Despublicar (Emergencia)

⚠️ **Solo usar en emergencias** (máximo 72 horas después de publicar):

```bash
# Despublicar versión específica
npm unpublish nodejs-nets-core@1.0.1

# Deprecar versión (mejor opción)
npm deprecate nodejs-nets-core@1.0.1 "Use version 1.0.2 instead. This version has a critical bug."
```

## 📊 Scripts Disponibles

```bash
npm run version:check      # Ver versión actual y sugerencias
npm run release:patch      # Release patch version
npm run release:minor      # Release minor version
npm run release:major      # Release major version
npm run release:beta       # Publicar versión beta
npm run clean              # Limpiar archivos build
npm run prepublishOnly     # Se ejecuta automáticamente antes de publish
```

## 🔐 Configuración de npm

### Autenticación con Token (CI/CD)

Para CI/CD, usa un token:

```bash
# Generar token en npmjs.com/settings/tokens
npm token create

# Agregar a .npmrc (no commitear)
//registry.npmjs.org/:_authToken=YOUR_TOKEN
```

### Configurar .npmrc local

```bash
# ~/.npmrc
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

## 📦 Contenido del Paquete

El paquete publicado incluye:
- ✅ `dist/` - Código JavaScript compilado
- ✅ `dist/**/*.d.ts` - Type definitions
- ✅ `templates/` - Email templates
- ✅ `README.md` - Documentación
- ✅ `LICENSE` - Licencia MIT
- ✅ `CHANGELOG.md` - Historial de cambios
- ✅ `.env.example` - Variables de entorno ejemplo

**NO incluye:**
- ❌ `src/` - Código TypeScript fuente
- ❌ `tests/` - Tests
- ❌ `scripts/` - Scripts de desarrollo
- ❌ `node_modules/` - Dependencias

Ver `.npmignore` para la lista completa.

## 🚨 Checklist Pre-Release

Antes de cada release, verifica:

- [ ] Todos los tests pasan (`npm test`)
- [ ] Linter sin errores (`npm run lint`)
- [ ] Código formateado (`npm run format`)
- [ ] CHANGELOG.md actualizado
- [ ] README.md actualizado si hay cambios en API
- [ ] Versión correcta en package.json
- [ ] Cambios commiteados en git
- [ ] Branch correcto (master/main)
- [ ] Dependencias actualizadas y sin vulnerabilidades (`npm audit`)

## 🔄 Workflow Recomendado

### Para Bug Fixes:
```bash
git checkout -b fix/bug-description
# ... hacer cambios ...
git add .
git commit -m "fix: descripción del fix"
git push origin fix/bug-description
# Crear Pull Request
# Después de merge a master:
npm run release:patch
```

### Para Nuevas Features:
```bash
git checkout -b feature/feature-name
# ... desarrollar feature ...
git add .
git commit -m "feat: descripción de la feature"
git push origin feature/feature-name
# Crear Pull Request
# Después de merge a master:
npm run release:minor
```

### Para Breaking Changes:
```bash
git checkout -b breaking/change-description
# ... hacer cambios ...
git add .
git commit -m "feat!: descripción del breaking change

BREAKING CHANGE: explicación detallada del cambio"
git push origin breaking/change-description
# Crear Pull Request
# Después de merge a master:
npm run release:major
```

## 📈 Monitoreo Post-Release

Después de publicar, monitorear:

1. **Downloads**: https://npm-stat.com/charts.html?package=nodejs-nets-core
2. **Bundle size**: https://bundlephobia.com/package/nodejs-nets-core
3. **Issues**: https://github.com/yourusername/nodejs-nets-core/issues
4. **npm page**: https://www.npmjs.com/package/nodejs-nets-core

## 🤝 Soporte

Si tienes problemas publicando:

1. Verifica que estás logueado: `npm whoami`
2. Verifica permisos: `npm access ls-collaborators nodejs-nets-core`
3. Revisa logs: `~/.npm/_logs/`
4. Contacta al equipo de npm: https://www.npmjs.com/support

## 📚 Referencias

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
