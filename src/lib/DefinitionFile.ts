import { join } from 'node:path'
import { Utils } from './Utils'

export class DefinitionFile {
  public static async make(): Promise<void> {
    const rootPath = process.cwd()
    const filename = 'icons.d.ts'
    const path = join(rootPath, filename)

    if (await Utils.fileExists(path))
      await Utils.rm(path)

    const contents = [
      '/* eslint-disable */',
      '/* prettier-ignore */',
      '// @ts-nocheck',
      '// Generated by unplugin-svg-transformer',
      'export {}',
      '',
      'declare module \'@vue/runtime-core\' {',
      '  interface ComponentCustomProperties {',
      // 'declare module \'vue\' {',
      // '  export interface GlobalComponents {',
      '    SvgIcon: typeof import(\'unplugin-svg-transformer/components\')[\'default\']',
      '  }',
      '}',
    ]

    const content = contents.join('\n')
    await Utils.write(path, content)
  }
}
