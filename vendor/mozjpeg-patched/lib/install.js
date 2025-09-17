import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import binBuild from 'bin-build';
import bin from './index.js';

const cpuNumber = Math.max(os.cpus().length, 1);
const ensureEnvFlag = (variable, flags) => {
  if (flags.length === 0) {
    return;
  }

  const existing = process.env[variable];
  const append = flags.join(' ');
  process.env[variable] = existing ? `${existing} ${append}` : append;
};

const addSearchPathsForDarwin = () => {
  const prefixes = [process.env.HOMEBREW_PREFIX, '/opt/homebrew', '/usr/local']
    .filter(Boolean)
    .filter((prefix) => {
      try {
        return fs.statSync(prefix).isDirectory();
      } catch {
        return false;
      }
    });

  const includeFlags = prefixes
    .map((prefix) => path.join(prefix, 'include'))
    .filter((includePath) => fs.existsSync(path.join(includePath, 'png.h')))
    .map((includePath) => `-I${includePath}`);

  const libFlags = prefixes
    .map((prefix) => path.join(prefix, 'lib'))
    .filter((libPath) =>
      fs.existsSync(path.join(libPath, 'libpng16.a')) ||
      fs.existsSync(path.join(libPath, 'libpng16.dylib')) ||
      fs.existsSync(path.join(libPath, 'libpng.dylib'))
    )
    .map((libPath) => `-L${libPath}`);

  const pkgConfigPaths = prefixes
    .map((prefix) => path.join(prefix, 'lib', 'pkgconfig'))
    .filter((pkgPath) => fs.existsSync(pkgPath));

  ensureEnvFlag('CPPFLAGS', includeFlags);
  ensureEnvFlag('LDFLAGS', libFlags);

  if (pkgConfigPaths.length > 0) {
    const existing = process.env.PKG_CONFIG_PATH;
    process.env.PKG_CONFIG_PATH = existing
      ? `${existing}:${pkgConfigPaths.join(':')}`
      : pkgConfigPaths.join(':');
  }
};

bin.run(['-version'])
  .then(() => {
    console.log('mozjpeg pre-build test passed successfully');
  })
  .catch(async (error) => {
    console.warn(error.message);
    console.warn('mozjpeg pre-build test failed');
    console.info('compiling from source');

    let cfgExtras = '';

    if (process.platform === 'darwin') {
      addSearchPathsForDarwin();
      cfgExtras = '--enable-static';
    }

    const configureArgs = [
      './configure --enable-static --disable-shared --disable-dependency-tracking --with-jpeg8',
      cfgExtras,
      `--prefix="${bin.dest()}" --bindir="${bin.dest()}" --libdir="${bin.dest()}"`,
    ]
      .filter(Boolean)
      .join(' ');

    try {
      const source = fileURLToPath(new URL('../vendor/source/mozjpeg.tar.gz', import.meta.url));
      await binBuild.file(source, [
        'autoreconf -fiv',
        configureArgs,
        `make -j${cpuNumber}`,
        `make install -j${cpuNumber}`,
      ]);

      console.log('mozjpeg built successfully');
    } catch (error_) {
      console.error(error_.stack);

      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }
  });
