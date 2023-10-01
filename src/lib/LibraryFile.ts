import { dirname } from 'node:path'
import type { OptionsExtended } from '../types'
import type { SvgItem } from './Svg/SvgItem'
import { Path } from './Path'
import type { SvgCollection } from './Svg/SvgCollection'

export class LibraryFile {
  protected constructor(
    protected items: SvgItem[] = [],
    protected library: string = '',
    protected types: string[] = [],
    protected options: OptionsExtended = {},
    protected extension = 'ts',
  ) { }

  public static async make(collect: SvgCollection, options: OptionsExtended): Promise<LibraryFile> {
    const self = new LibraryFile(collect.getItems())

    self.extension = options.useTypes ? 'ts' : 'js'
    self.options = options
    self.types = self.setTypes()
    self.library = self.setLibrary()

    return self
  }

  public getTypes(): string[] {
    return this.types
  }

  public getTypesString(): string {
    return `export type SvgName = ${this.types.join(' | ')}`
  }

  private setLibrary(withWindow = true): string {
    let content: string[] = [
      '/* eslint-disable eslint-comments/no-unlimited-disable */',
      '/* eslint-disable */',
      '/* prettier-ignore */',
      '// @ts-nocheck',
      '// Generated by unplugin-svg-transformer',
    ]

    if (this.options.useTypes || this.options.isNuxt) {
      content = [
        ...content,
        this.getTypesString(),
      ]
    }

    let options = JSON.stringify(this.parseOptions(), null, 2)
    options = options.replace(/"([^(")"]+)":/g, '$1:')
    content = [
      ...content,
      `export const options = ${options}`,
      this.options.useTypes ? 'export const svgList: Record<SvgName, () => Promise<{ default: string }>> = {' : 'export const svgList = {',
    ]

    const libraryFile = `${this.options.libraryDir}/icons.${this.extension}` // `/Users/ewilan/Workspace/vite-plugin-svg/examples/ts/icons.ts`
    this.items.forEach((item) => {
      const baseIconPath = item.getPath().replace('.svg', `.${this.extension}`)
      const iconPath = Path.normalizePaths([this.options.cacheDir!, baseIconPath]) // `/Users/ewilan/Workspace/vite-plugin-svg/examples/ts/cache/default.ts`

      let path = Path.relativePath(libraryFile, iconPath)
      path = Path.normalizePaths(path) // `./cache/default.ts`

      if (this.options.isNuxt)
        path = `./icons${baseIconPath}`

      content.push(`  '${item.getName()}': () => import('${path}'),`)
    })

    content = [
      ...content,
      '}',
      '',
      this.options.useTypes ? 'export async function importSvg(name: SvgName): Promise<string> {' : 'export async function importSvg(name) {',
      '  if (!svgList[name] && options.warning)',
      // eslint-disable-next-line no-template-curly-in-string
      '    console.warn(`Icon ${name} not found`)',
      '  const icon = svgList[name] || svgList["default"]',
      '  const svg = await icon()',
      '',
      '  return svg.default',
      '}',
    ]

    if (withWindow && !this.options.isNuxt) {
      content = [
        ...content,
        '',
        'if (typeof window !== \'undefined\') {',
        '  window.ust = window.ust || {}',
        '  window.ust.options = options',
        '  window.ust.svgList = svgList',
        '  window.ust.importSvg = importSvg',
        '}',
        '',
      ]
    }

    return content.join('\n')
  }

  private parseOptions(): OptionsExtended {
    return {
      fallback: this.options.fallback,
      svg: {
        classDefault: this.options.svg?.classDefault ?? undefined,
        clearSize: this.options.svg?.clearSize ?? 'none',
        clearClass: this.options.svg?.clearClass ?? 'none',
        clearStyle: this.options.svg?.clearStyle ?? 'none',
        currentColor: this.options.svg?.currentColor ?? false,
        inlineStyleDefault: this.options.svg?.inlineStyleDefault ?? undefined,
        sizeInherit: this.options.svg?.sizeInherit ?? false,
        title: this.options.svg?.title ?? undefined,
      },
      warning: this.options.warning ?? false,
      cacheDir: this.parseOptionPath(this.options.cacheDir),
      global: this.options.global ?? false,
      libraryDir: this.parseOptionPath(this.options.libraryDir),
      svgDir: this.parseOptionPath(this.options.svgDir),
      useTypes: this.options.useTypes ?? false,
    }
  }

  private parseOptionPath(path?: string): string | undefined {
    if (!path)
      return undefined

    path = path.replace(`${Path.rootPath()}/`, '')
    return `./${path}`
  }

  /**
   * Create types from `SvgItem[]`
   */
  private setTypes(): string[] {
    const types: string[] = []
    this.items.forEach((item) => {
      types.push(`'${item.getName()}'`)
    })

    return types
  }

  /**
   * Write library file, `icon.ts`.
   */
  private async writeFile(path: string): Promise<void> {
    path = Path.normalizePaths(path)

    if (await Path.fileExists(path))
      await Path.rm(path)

    await Path.ensureDirectoryExists(dirname(path))
    await Path.write(path, this.library)
  }

  public async write(): Promise<void> {
    if (this.options.isNuxt) {
      const realFile = `${this.options.nuxtDir!}/icons.${this.extension}` // `/Users/ewilan/Workspace/vite-plugin-svg/examples/nuxt3/.nuxt/icons.ts`
      const symFile = `${Path.packagePath({ dist: true })}/icons.${this.extension}` // `/Users/ewilan/Workspace/vite-plugin-svg/examples/nuxt3/node_modules/unplugin-svg-transformer/dist/icons.ts`
      await this.writeFile(realFile)
      await Path.symLink(realFile, symFile)
    }
    else {
      const realFile = `${this.options.libraryDir!}/icons.${this.extension}` // `/Users/ewilan/Workspace/vite-plugin-svg/examples/ts/src/icons.ts`
      const symFile = `${Path.packagePath({ dist: true })}/icons.${this.extension}` // `/Users/ewilan/Workspace/vite-plugin-svg/examples/ts/node_modules/unplugin-svg-transformer/dist/icons.ts`
      await this.writeFile(realFile)
      await Path.symLink(realFile, symFile)
    }
  }
}
