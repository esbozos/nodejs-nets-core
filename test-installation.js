/**
 * Test de verificación de instalación de nodejs-nets-core
 * Este script verifica que todas las dependencias principales están instaladas
 * y que los módulos principales se pueden importar correctamente.
 */

console.log('🧪 Verificando instalación de nodejs-nets-core...\n');

// Test 1: Verificar dependencias críticas
console.log('1️⃣ Verificando dependencias críticas...');
const dependencies = [
  'express',
  'sequelize',
  'bcrypt',
  'jsonwebtoken',
  'nodemailer',
  'handlebars',
  'firebase-admin',
  'ioredis',
  'validator',
  'uuid',
];

let failed = false;
for (const dep of dependencies) {
  try {
    require.resolve(dep);
    console.log(`  ✅ ${dep}`);
  } catch (error) {
    console.log(`  ❌ ${dep} - NO ENCONTRADO`);
    failed = true;
  }
}

if (failed) {
  console.log('\n❌ Algunas dependencias no están instaladas correctamente.\n');
  process.exit(1);
}

console.log('\n2️⃣ Verificando archivos compilados...');
const fs = require('fs');
const path = require('path');

const requiredDirs = [
  'dist',
  'dist/models',
  'dist/services',
  'dist/middleware',
  'dist/decorators',
  'dist/utils',
  'dist/config',
  'dist/types',
];

for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✅ ${dir}/`);
  } else {
    console.log(`  ❌ ${dir}/ - NO ENCONTRADO`);
    failed = true;
  }
}

console.log('\n3️⃣ Verificando módulos principales...');
try {
  const { NetsCoreBaseModel } = require('./dist/models/base');
  console.log('  ✅ NetsCoreBaseModel');

  const { User } = require('./dist/models/User');
  console.log('  ✅ User Model');

  const { VerificationCode } = require('./dist/models/VerificationCode');
  console.log('  ✅ VerificationCode Model');

  const { UserDevice } = require('./dist/models/UserDevice');
  console.log('  ✅ UserDevice Model');

  const { Permission, Role } = require('./dist/models/Permission');
  console.log('  ✅ Permission & Role Models');

  const { AuthService } = require('./dist/services/auth');
  console.log('  ✅ AuthService');

  const { EmailService } = require('./dist/services/email');
  console.log('  ✅ EmailService');

  const { FirebaseService } = require('./dist/services/firebase');
  console.log('  ✅ FirebaseService');

  const { requestHandlerMiddleware } = require('./dist/decorators');
  console.log('  ✅ requestHandlerMiddleware');

  const { authMiddleware } = require('./dist/middleware');
  console.log('  ✅ authMiddleware');

  console.log('\n✅ Todos los módulos principales se importaron correctamente.');
} catch (error) {
  console.log(`\n❌ Error al importar módulos: ${error.message}`);
  failed = true;
}

console.log('\n4️⃣ Verificando TypeScript...');
const { execSync } = require('child_process');
try {
  execSync('npx tsc --version', { stdio: 'pipe' });
  console.log('  ✅ TypeScript instalado');
} catch (error) {
  console.log('  ❌ Error con TypeScript');
  failed = true;
}

console.log('\n5️⃣ Resumen de archivos generados:');
const countFiles = (dir, ext) => {
  try {
    const output = execSync(`find ${dir} -name "*.${ext}" | wc -l`, { encoding: 'utf8' });
    return parseInt(output.trim());
  } catch {
    return 0;
  }
};

const jsFiles = countFiles('dist', 'js');
const dtsFiles = countFiles('dist', 'd.ts');
const mapFiles = countFiles('dist', 'map');

console.log(`  📄 Archivos JavaScript (.js): ${jsFiles}`);
console.log(`  📄 Archivos de definición (.d.ts): ${dtsFiles}`);
console.log(`  📄 Archivos source map (.map): ${mapFiles}`);

if (failed) {
  console.log('\n❌ La verificación encontró algunos problemas.\n');
  process.exit(1);
} else {
  console.log('\n✅ ¡Instalación verificada exitosamente!');
  console.log('\n📚 Pasos siguientes:');
  console.log('  1. Configura tu .env con las credenciales de base de datos');
  console.log('  2. Ejecuta las migraciones de base de datos');
  console.log('  3. Revisa los ejemplos en examples/basic-app.ts');
  console.log('  4. Lee la documentación en README.md\n');
}
