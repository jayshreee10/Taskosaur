#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let outDir = '../dist';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--outDir' && args[i + 1]) {
    outDir = args[i + 1];
    break;
  }
}

const outDirAbsolute = path.resolve(__dirname, outDir);
const outDirRelative = path.relative(__dirname, outDirAbsolute);

const tsconfigPath = path.join(__dirname, 'tsconfig.json');
const tsconfigBuildPath = path.join(__dirname, 'tsconfig.build.json');
const nestCliPath = path.join(__dirname, 'nest-cli.json');

const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
const originalOutDir = tsconfig.compilerOptions.outDir;

const nestCli = JSON.parse(fs.readFileSync(nestCliPath, 'utf8'));
const originalAssets = JSON.parse(JSON.stringify(nestCli.compilerOptions.assets));

try {
  tsconfig.compilerOptions.outDir = outDirRelative;
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

  if (fs.existsSync(tsconfigBuildPath)) {
    const tsconfigBuild = JSON.parse(fs.readFileSync(tsconfigBuildPath, 'utf8'));
    if (tsconfigBuild.compilerOptions && tsconfigBuild.compilerOptions.outDir) {
      tsconfigBuild.compilerOptions.outDir = outDirRelative;
      fs.writeFileSync(tsconfigBuildPath, JSON.stringify(tsconfigBuild, null, 2));
    }
  }

  if (nestCli.compilerOptions && nestCli.compilerOptions.assets) {
    nestCli.compilerOptions.assets = nestCli.compilerOptions.assets.map(asset => {
      if (typeof asset === 'object' && asset.outDir) {
        const assetDir = asset.outDir.replace(/^(\.\.\/)?dist/, outDirRelative);
        return { ...asset, outDir: assetDir };
      }
      return asset;
    });
    fs.writeFileSync(nestCliPath, JSON.stringify(nestCli, null, 2));
  }

  console.log(`Building with output directory: ${outDirAbsolute}`);
  execSync('nest build', { stdio: 'inherit' });

  // Create minimal package.json in output directory
  const sourcePackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  // Extract production dependencies and add prisma for migrations
  const productionDependencies = { ...sourcePackageJson.dependencies };
  
  // Add prisma from devDependencies to production dependencies if it exists
  if (sourcePackageJson.devDependencies && sourcePackageJson.devDependencies.prisma) {
    productionDependencies.prisma = sourcePackageJson.devDependencies.prisma;
  }
  
  const minimalPackageJson = {
    name: sourcePackageJson.name,
    version: sourcePackageJson.version,
    description: sourcePackageJson.description,
    author: sourcePackageJson.author,
    license: sourcePackageJson.license,
    main: 'main.js',
    scripts: {
      start: 'node main.js',
      'start:prod': 'node main.js',
      'prisma:generate': 'prisma generate',
      'prisma:migrate:deploy': 'prisma migrate deploy',
      'postinstall': 'prisma generate'
    },
    dependencies: productionDependencies,
    engines: sourcePackageJson.engines
  };

  // Write the minimal package.json to the output directory
  const outputPackageJsonPath = path.join(outDirAbsolute, 'package.json');
  fs.writeFileSync(outputPackageJsonPath, JSON.stringify(minimalPackageJson, null, 2));

  // Copy prisma folder if it exists
  const prismaSourcePath = path.join(__dirname, 'prisma');
  const prismaDestPath = path.join(outDirAbsolute, 'prisma');
  
  if (fs.existsSync(prismaSourcePath)) {
    // Create prisma directory in output
    if (!fs.existsSync(prismaDestPath)) {
      fs.mkdirSync(prismaDestPath, { recursive: true });
    }
    
    // Copy schema.prisma file
    const schemaSourcePath = path.join(prismaSourcePath, 'schema.prisma');
    if (fs.existsSync(schemaSourcePath)) {
      fs.copyFileSync(schemaSourcePath, path.join(prismaDestPath, 'schema.prisma'));
    }
    
    // Copy migrations folder if it exists
    const migrationsSourcePath = path.join(prismaSourcePath, 'migrations');
    if (fs.existsSync(migrationsSourcePath)) {
      const copyDirRecursive = (src, dest) => {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      
      copyDirRecursive(migrationsSourcePath, path.join(prismaDestPath, 'migrations'));
    }
  }

  // Process .env file from repo root or backend directory
  const repoRootEnvPath = path.join(__dirname, '..', '.env');
  const backendEnvPath = path.join(__dirname, '.env');
  const envDestPath = path.join(outDirAbsolute, '.env');
  
  let envSourcePath = null;
  if (fs.existsSync(repoRootEnvPath)) {
    envSourcePath = repoRootEnvPath;
    console.log(`Processing .env from repository root`);
  } else if (fs.existsSync(backendEnvPath)) {
    envSourcePath = backendEnvPath;
    console.log(`Processing .env from backend directory`);
  }
  
  if (envSourcePath) {
    // Read and process the .env file
    const envContent = fs.readFileSync(envSourcePath, 'utf8');
    const lines = envContent.split('\n');
    const processedLines = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Keep comments and empty lines
      if (trimmedLine.startsWith('#') || trimmedLine === '') {
        processedLines.push(line);
        continue;
      }
      
      // Check if line contains a BE_ prefixed variable
      const match = trimmedLine.match(/^BE_([^=]+)=(.*)$/);
      if (match) {
        // Remove BE_ prefix and add to processed lines
        const varName = match[1];
        const varValue = match[2];
        processedLines.push(`${varName}=${varValue}`);
      }
      // Skip lines that don't have BE_ prefix
    }
    
    // Write the processed .env file to the destination
    fs.writeFileSync(envDestPath, processedLines.join('\n'));
    console.log(`Created filtered .env in ${outDirRelative} (only BE_ prefixed variables, prefix removed)`);
  } else {
    console.log(`Warning: No .env file found in repository root or backend directory`);
  }

  console.log(`Build completed successfully! Output: ${outDirAbsolute}`);
  console.log(`Created minimal package.json in ${outDirAbsolute}`);
  console.log(`\nTo run the application from ${outDirRelative}:`);
  console.log(`  cd ${outDirRelative}`);
  console.log(`  npm install --production`);
  console.log(`  npm start`);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} finally {
  tsconfig.compilerOptions.outDir = originalOutDir;
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

  if (fs.existsSync(tsconfigBuildPath)) {
    const tsconfigBuild = JSON.parse(fs.readFileSync(tsconfigBuildPath, 'utf8'));
    if (tsconfigBuild.compilerOptions && tsconfigBuild.compilerOptions.outDir) {
      tsconfigBuild.compilerOptions.outDir = originalOutDir;
      fs.writeFileSync(tsconfigBuildPath, JSON.stringify(tsconfigBuild, null, 2));
    }
  }

  nestCli.compilerOptions.assets = originalAssets;
  fs.writeFileSync(nestCliPath, JSON.stringify(nestCli, null, 2));
}