import { normalizePath, type Plugin, type ViteDevServer } from 'vite';
import path from 'node:path';
import { createJiti } from 'jiti';

const b64encode = (str: string) =>
  Buffer.from(str, 'utf-8').toString('base64').replaceAll('/', '_');

const b64decode = (str: string) =>
  Buffer.from(str.replaceAll('_', '/'), 'base64').toString('utf-8');

const parseSource = (source: string) => {
  if (!source.endsWith('.css')) {
    return;
  }

  const lastSlash = source.lastIndexOf('/');

  if (lastSlash < 0) {
    return;
  }

  let scriptPath = source.slice(0, lastSlash);
  const styleName = source.slice(lastSlash + 1).replace(/\.css$/, '');

  if (scriptPath.startsWith('/') || scriptPath.startsWith(':')) {
    scriptPath = scriptPath.slice(1);
  }

  return {
    scriptPath,
    styleName,
  };
};

export const dynamicStyle: () => Plugin = () => {
  const vmId = 'virtual:dynamic-style';
  const resolvedVmId = '\0' + vmId;
  let server = undefined as any as ViteDevServer;

  return {
    name: vmId,
    enforce: 'post',

    configureServer(_server) {
      server = _server;
    },

    async resolveId(source, importer, options) {
      if (source.startsWith(vmId)) {
        return `${resolvedVmId}/${b64encode(importer ?? '')}/${b64encode(source.slice(vmId.length))}.css`;
      }
    },

    async load(id, options) {
      if (id.startsWith(resolvedVmId)) {
        const [, _importer, _source] = id.split('/');
        // example: "/myprojcet/src/components/a.astro"
        const importer = b64decode(_importer);
        // example: "/abc.ts/abc.css"
        const source = normalizePath(b64decode(_source.replace(/\.css$/, '')));

        const { scriptPath, styleName } = parseSource(source) ?? {};

        if (!scriptPath) {
          throw new Error(`Invalid script path: ${scriptPath}`);
        }
        if (!styleName) {
          throw new Error(`Invalid style name: ${styleName}`);
        }

        const importerDir = path.dirname(importer);
        const resolvedPath = path.resolve(importerDir, scriptPath);

        this.addWatchFile(resolvedPath);

        const jiti = createJiti(resolvedPath);
        let module: any;
        if (this.environment.mode === 'dev') {
          const mod = server.moduleGraph.getModuleById(resolvedPath);
          if (mod) {
            // Invalidate the old module so that we can re-evaluate the module.
            server.moduleGraph.invalidateModule(mod);
          }
          module = await server.ssrLoadModule(resolvedPath);
        } else if (this.environment.mode === 'build') {
          module = await jiti.import(resolvedPath);
        } else {
          this.error(`Unsupported vite mode: ${this.environment.mode}`);
        }

        const typeError = () =>
          this.error(
            `Module ${resolvedPath} style ${styleName} does not return a string.`,
          );

        const getStyleSheets = () => {
          const styleSheets = module.styleSheets ?? module.default.styleSheets;
          if (!styleSheets) {
            this.error(`Module ${resolvedPath} does not export styles.`);
          }
          return styleSheets;
        };

        const processValue = async (targetStyle: any) => {
          if (typeof targetStyle === 'string') {
            // String
            return targetStyle;
          } else if (typeof targetStyle === 'function') {
            // Function
            const result = targetStyle();
            if (typeof result === 'string') {
              return result;
            } else if (result instanceof Promise) {
              // Asynchronous Function
              const awaited = await result;
              if (typeof awaited !== 'string') {
                typeError();
              }
              return awaited;
            }
          } else if (targetStyle === null || targetStyle === undefined) {
            this.error(
              `Module ${resolvedPath} does not have style ${styleName}.`,
            );
          } else {
            typeError();
          }
        };

        if (styleName === 'default') {
          return await processValue(module.default);
        } else {
          return await processValue(getStyleSheets()[styleName]);
        }
      }
    },
  };
};
