export interface Options {
  /**
   * Directory where the SVG files are located.
   *
   * @default './src/icons'
   */
  iconsDir: string
  /**
   * Directory where the cache files will be created.
   *
   * @default './src/icons/cache'
   */
  cacheDir: string
  /**
   * File where the types and list of icons will be created.
   *
   * @default './src/icons.ts'
   */
  filenamePath: string
  /**
   * Path to the .gitignore file.
   *
   * @default './.gitignore'
   */
  gitignorePath: string
}
