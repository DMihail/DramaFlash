import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import eas from '../../eas.json';
import packageJson from '../../package.json';

const root = path.join(__dirname, '../..');

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function testFilesUnder(directory: string): string[] {
  const matches: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') {
        matches.push(fullPath);
      }
      matches.push(...testFilesUnder(fullPath));
      continue;
    }

    if (/(?:^|[-.])test\.tsx?$/.test(entry.name)) {
      matches.push(fullPath);
    }
  }

  return matches;
}

describe('project toolchain', () => {
  test('stays on Expo SDK 58 and React Native 0.88', () => {
    expect(packageJson.dependencies.expo).toMatch(/^~58\./);
    expect(packageJson.dependencies['expo-router']).toMatch(/^~58\./);
    expect(packageJson.dependencies['react-native']).toMatch(/^0\.88\./);
    expect(packageJson.dependencies['expo-dev-client']).toMatch(/^~58\./);
    expect(packageJson.devDependencies['jest-expo']).toMatch(/^~58\./);
    expect(packageJson.devDependencies.jest).toMatch(/^~30\./);
  });

  test('keeps TypeScript strict', () => {
    const tsconfig = JSON.parse(read('tsconfig.json')) as {
      compilerOptions: {
        strict: boolean;
        exactOptionalPropertyTypes: boolean;
        noImplicitAny: boolean;
        noUncheckedIndexedAccess: boolean;
        noFallthroughCasesInSwitch: boolean;
        forceConsistentCasingInFileNames: boolean;
      };
    };

    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.exactOptionalPropertyTypes).toBe(true);
    expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
    expect(tsconfig.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    expect(tsconfig.compilerOptions.noFallthroughCasesInSwitch).toBe(true);
    expect(tsconfig.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
  });

  test('uses the same Node.js version locally and on EAS', () => {
    const nodeVersion = read('.nvmrc').trim();

    expect(nodeVersion).toBe('22.22.0');
    expect(eas.build.base.node).toBe(nodeVersion);
    expect(packageJson.packageManager).toBe('npm@11.19.0');
    expect(packageJson.engines.npm).toBe('>=11.19.0 <12');
    expect(packageJson.scripts['eas-build-pre-install']).toBe('npm install --global npm@11.19.0');
    expect(read('.npmrc')).toContain('engine-strict=true');
  });

  test('development and production EAS profiles select separate app variants', () => {
    expect(eas.build.development.developmentClient).toBe(true);
    expect(eas.build.development.distribution).toBe('internal');
    expect(eas.build.development.environment).toBe('development');
    expect(eas.build.development.env.APP_VARIANT).toBe('development');

    expect(eas.build['development-simulator'].extends).toBe('development');
    expect(eas.build['development-simulator'].ios.simulator).toBe(true);

    expect(eas.build.production.environment).toBe('production');
    expect(eas.build.production.env.APP_VARIANT).toBe('production');
    expect(eas.build.production).not.toHaveProperty('developmentClient');
  });

  test('CI validates the repository without native builds or secret access', () => {
    const workflow = read('.github/workflows/ci.yml');

    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('npm run eas-build-pre-install');
    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('npm run format:check');
    expect(workflow).toContain('npm run typecheck');
    expect(workflow).toContain('npm test');
    expect(workflow).toContain('npm run doctor');
    expect(workflow).not.toContain('pull_request_target');
    expect(workflow).not.toContain('secrets.');
    expect(workflow).not.toContain('eas build');
  });

  test('keeps application tests in the root tests directory', () => {
    expect(packageJson.jest.testMatch).toEqual([
      '<rootDir>/tests/**/*-test.ts',
      '<rootDir>/tests/**/*-test.tsx',
    ]);
    expect(packageJson.jest.testPathIgnorePatterns).toEqual([
      '/node_modules/',
      '/High-Fidelity DramaFlash Prototype/',
      '/references/',
    ]);
    expect(testFilesUnder(path.join(root, 'src'))).toEqual([]);
    expect(testFilesUnder(path.join(root, 'tests')).length).toBeGreaterThan(0);
  });

  test('gitignore excludes credentials and generated native projects', () => {
    const gitignore = read('.gitignore');

    for (const entry of [
      '.env',
      '!.env.example',
      'credentials.json',
      '*.jks',
      '*.p8',
      '*.p12',
      '*.keystore',
      'google-services.json',
      'GoogleService-Info.plist',
      '/ios',
      '/android',
      '*.apk',
      '*.aab',
      '*.ipa',
    ]) {
      expect(gitignore).toContain(entry);
    }
  });
});
