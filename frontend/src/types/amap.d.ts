declare global {
  interface Window {
    AMap: AMapNamespace
    _AMapSecurityConfig?: {
      securityJsCode: string
    }
  }
}

interface AMapNamespace {
  Map: new (container: string | HTMLElement, options: AMap.MapOptions) => AMap.Map
  Marker: new (options: AMap.MarkerOptions) => AMap.Marker
  InfoWindow: new (options: AMap.InfoWindowOptions) => AMap.InfoWindow
  Polygon: new (options: AMap.PolygonOptions) => AMap.Polygon
  Bounds: new (southWest?: AMap.LngLat, northEast?: AMap.LngLat) => AMap.Bounds
  LngLat: new (lng: number, lat: number) => AMap.LngLat
  Pixel: new (x: number, y: number) => AMap.Pixel
  Size: new (width: number, height: number) => AMap.Size
  Scale: new (options?: AMap.ScaleOptions) => AMap.Scale
  ToolBar: new (options?: AMap.ToolBarOptions) => AMap.ToolBar
  DistrictSearch: new (options?: AMap.DistrictSearchOptions) => AMap.DistrictSearch
  MarkerClusterer: new (map: AMap.Map, markers: AMap.Marker[], options?: any) => AMap.MarkerClusterer
  MassMarks: new (data: any[], options: AMap.MassMarksOptions) => AMap.MassMarks
  plugin: (plugins: string | string[], callback: () => void) => void
}

declare namespace AMap {
  interface Map {
    setZoom(zoom: number): void
    getZoom(): number
    setCenter(center: LngLat | [number, number]): void
    getCenter(): LngLat
    setBounds(bounds: Bounds): void
    getBounds(): Bounds
    setFeatures(features: string[]): void
    getFeatures(): string[]
    addControl(control: any): void
    removeControl(control: any): void
    add(overlay: any | any[]): void
    remove(overlay: any | any[]): void
    destroy(): void
    on(event: string, handler: Function): void
    off(event: string, handler: Function): void
    clearMap(): void
  }

  interface MapOptions {
    zoom?: number
    center?: LngLat | [number, number]
    viewMode?: '2D' | '3D'
    pitch?: number
    mapStyle?: string
    features?: string[]
    resizeEnable?: boolean
    rotateEnable?: boolean
    showLabel?: boolean
    showBuildingBlock?: boolean
  }

  interface Marker {
    setPosition(position: LngLat | [number, number]): void
    getPosition(): LngLat
    setTitle(title: string): void
    getTitle(): string
    setMap(map: Map | null): void
    getMap(): Map | null
    on(event: string, handler: Function): void
    off(event: string, handler: Function): void
    setAnimation(animation: string): void
    getAnimation(): string
    setOffset(offset: Pixel): void
    getOffset(): Pixel
    setContent(content: string | HTMLElement): void
    getContent(): string | HTMLElement
  }

  interface MarkerOptions {
    position: LngLat | [number, number]
    title?: string
    content?: string | HTMLElement
    offset?: Pixel
    animation?: string
    clickable?: boolean
    draggable?: boolean
    cursor?: string
    angle?: number
    autoRotation?: boolean
    zIndex?: number
    topWhenClick?: boolean
    bubble?: boolean
  }

  interface InfoWindow {
    open(map: Map, position?: LngLat | [number, number]): void
    close(): void
    setPosition(position: LngLat | [number, number]): void
    getPosition(): LngLat
    setContent(content: string | HTMLElement): void
    getContent(): string | HTMLElement
    setSize(size: Size): void
    getSize(): Size
    setOffset(offset: Pixel): void
    getOffset(): Pixel
    show(): void
    hide(): void
    isOpen(): boolean
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement
    offset?: Pixel
    size?: Size
    isCustom?: boolean
    autoMove?: boolean
    closeWhenClickMap?: boolean
    showShadow?: boolean
  }

  interface Polygon {
    setPath(path: Array<LngLat | [number, number]>): void
    getPath(): Array<LngLat>
    setMap(map: Map | null): void
    getMap(): Map | null
    setStyle(options: PolygonStyleOptions): void
    getStyle(): PolygonStyleOptions
    show(): void
    hide(): void
    on(event: string, handler: Function): void
    off(event: string, handler: Function): void
  }

  interface PolygonOptions {
    path: Array<LngLat | [number, number]>
    strokeColor?: string
    strokeOpacity?: number
    strokeWeight?: number
    strokeStyle?: string
    strokeDasharray?: Array<number>
    fillColor?: string
    fillOpacity?: number
    bubble?: boolean
    zIndex?: number
  }

  interface PolygonStyleOptions {
    strokeColor?: string
    strokeOpacity?: number
    strokeWeight?: number
    strokeStyle?: string
    strokeDasharray?: Array<number>
    fillColor?: string
    fillOpacity?: number
  }

  interface Bounds {
    extend(lnglat: LngLat | [number, number]): void
    contains(lnglat: LngLat | [number, number]): boolean
    getSouthWest(): LngLat
    getNorthEast(): LngLat
    getCenter(): LngLat
    isEmpty(): boolean
  }

  interface LngLat {
    getLng(): number
    getLat(): number
    setLng(lng: number): void
    setLat(lat: number): void
    equals(lnglat: LngLat): boolean
    toString(): string
    toArray(): [number, number]
  }

  interface Pixel {
    getX(): number
    getY(): number
    setX(x: number): void
    setY(y: number): void
    equals(pixel: Pixel): boolean
    toString(): string
  }

  interface Size {
    getWidth(): number
    getHeight(): number
    setWidth(width: number): void
    setHeight(height: number): void
    equals(size: Size): boolean
    toString(): string
  }

  interface Scale {
    show(): void
    hide(): void
  }

  interface ScaleOptions {
    position?: string
    offset?: Pixel
  }

  interface ToolBar {
    show(): void
    hide(): void
  }

  interface ToolBarOptions {
    position?: string
    offset?: Pixel
    ruler?: boolean
    direction?: boolean
    autoPosition?: boolean
  }

  interface DistrictSearch {
    search(keyword: string, callback: (status: string, result: DistrictSearchResult) => void): void
    setSubdistrict(level: number): void
  }

  interface DistrictSearchOptions {
    level?: string
    subdistrict?: number
    extensions?: string
    showbiz?: boolean
  }

  interface DistrictSearchResult {
    districtList: District[]
  }

  interface District {
    name: string
    adcode: string
    level: string
    center: LngLat
    boundaries: Array<Array<[number, number]>>
  }

  interface MarkerClusterer {
    setMarkers(markers: Marker[]): void
    getMarkers(): Marker[]
    addMarkers(markers: Marker[]): void
    removeMarkers(markers: Marker[]): void
    clearMarkers(): void
    setMap(map: Map | null): void
    getMap(): Map | null
    setGridSize(size: number): void
    setMaxZoom(zoom: number): void
  }

  interface MassMarks {
    setData(data: any[]): void
    getData(): any[]
    setMap(map: Map | null): void
    getMap(): Map | null
    setStyle(style: any | any[]): void
    getStyle(): any | any[]
    show(): void
    hide(): void
    on(event: string, handler: Function): void
    off(event: string, handler: Function): void
  }

  interface MassMarksOptions {
    opacity?: number
    zIndex?: number
    cursor?: string
    zooms?: number[]
    style?: MassMarksStyle[]
  }

  interface MassMarksStyle {
    url: string
    size: Size
    anchor?: Pixel
    rotation?: number
  }
}

export {}
