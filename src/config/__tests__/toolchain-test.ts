import { readFileSync } from 'node:fs';
import path from 'node:path';

import eas from '../../../eas.json';
import packageJson from '../../../package.json';

const root = path.join(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), 'utf8');
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
      compilerOptions: { strict: boolean };
    };

    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  test('uses the same Node.js version locally and on EAS', () => {
    const nodeVersion = read('.nvmrc').trim();

    expect(nodeVersion).toBe('22.22.0');
    expect(eas.build.base.node).toBe(nodeVersion);
    expect(packageJson.packageManager).toBe('npm@11.19.0');
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
    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('npm run typecheck');
    expect(workflow).toContain('npm test');
    expect(workflow).toContain('npm run doctor');
    expect(workflow).not.toContain('pull_request_target');
    expect(workflow).not.toContain('secrets.');
    expect(workflow).not.toContain('eas build');
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
