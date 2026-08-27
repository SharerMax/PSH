declare module '@svg-maps/world' {
  export interface SvgMapLocation {
    id: string
    name: string
    path: string
  }

  export interface SvgMap {
    label: string
    viewBox: string
    locations: SvgMapLocation[]
  }

  const world: SvgMap
  export default world
}
