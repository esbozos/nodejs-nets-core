# ✅ Release Checklist

Use esta checklist antes de cada release.

## Pre-Release

### Código
- [ ] Todos los cambios están commiteados
- [ ] Branch correcto (master/main)
- [ ] No hay work in progress (WIP)
- [ ] Código revisado (PR aprobado si aplica)

### Tests
- [ ] `npm test` - Todos los tests pasan
- [ ] `npm run test:coverage` - Cobertura aceptable (>80%)
- [ ] Tests manuales realizados
- [ ] Probado en Node.js 18+

### Calidad de Código
- [ ] `npm run lint` - Sin errores
- [ ] `npm run format:check` - Código formateado
- [ ] `npm run build` - Compila sin errores
- [ ] Sin warnings de TypeScript

### Seguridad
- [ ] `npm audit` - Sin vulnerabilidades críticas
- [ ] Dependencias actualizadas
- [ ] `.env.example` actualizado
- [ ] Secrets no expuestos

### Documentación
- [ ] README.md actualizado
- [ ] CHANGELOG.md con nuevos cambios
- [ ] JSDoc/TSDoc actualizado
- [ ] Ejemplos funcionando
- [ ] Migration guide si hay breaking changes

### Versioning
- [ ] Tipo de versión correcto (patch/minor/major)
- [ ] Versión en package.json correcta
- [ ] Breaking changes documentados si es major

## Durante Release

- [ ] Script de release ejecutado (`npm run release:X`)
- [ ] Tests pasaron automáticamente
- [ ] Build exitoso
- [ ] CHANGELOG actualizado
- [ ] Git commit y tag creados
- [ ] npm publish exitoso
- [ ] Git push completado

## Post-Release

### Verificación
- [ ] Paquete visible en npm
- [ ] Versión correcta en npm
- [ ] `npm install nodejs-nets-core` funciona
- [ ] Import básico funciona
- [ ] Types (.d.ts) disponibles

### Comunicación
- [ ] GitHub release creado
- [ ] Release notes publicadas
- [ ] Equipo notificado
- [ ] Usuarios notificados (si es major)

### Monitoreo
- [ ] Downloads tracking activo
- [ ] Bundle size verificado
- [ ] Issues en GitHub revisadas
- [ ] Feedback de usuarios monitoreado

## Rollback Plan

Si algo sale mal:

1. **npm**: Deprecar versión problemática
   ```bash
   npm deprecate nodejs-nets-core@X.Y.Z "Use version X.Y.Z+1 instead"
   ```

2. **Git**: Revertir tag si es necesario
   ```bash
   git tag -d vX.Y.Z
   git push origin :refs/tags/vX.Y.Z
   ```

3. **Fix**: Publicar hotfix inmediatamente
   ```bash
   # Fix el problema
   npm run release:patch
   ```

## Notas

- **Patch**: Bug fixes, no breaking changes
- **Minor**: New features, backwards compatible
- **Major**: Breaking changes, API changes

## Template para Release Notes

```markdown
## [X.Y.Z] - YYYY-MM-DD

### 🎉 Highlights
- Main feature or fix

### ✨ Added
- New feature 1
- New feature 2

### 🔄 Changed
- Changed behavior 1
- Updated dependency X

### 🐛 Fixed
- Bug fix 1
- Bug fix 2

### 🗑️ Deprecated
- Feature X will be removed in vN.0.0

### 💥 Breaking Changes
- Changed API signature of X
- Removed deprecated feature Y

### 📚 Documentation
- Updated guide for X
- Added example for Y

### 🔒 Security
- Fixed vulnerability in dependency X
```

## Useful Commands

```bash
# Ver status
npm run version:check

# Ver cambios desde último tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Ver archivos que se publicarán
npm pack --dry-run

# Ver info del paquete
npm info nodejs-nets-core

# Test de instalación
npm install nodejs-nets-core --dry-run
```
