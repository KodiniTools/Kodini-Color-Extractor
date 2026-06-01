export interface Color {
  r: number
  g: number
  b: number
  hex: string
  hsl?: { h: number; s: number; l: number }
}

export interface ImageAdjustments {
  zoom: number
  brightness: number
  contrast: number
  saturation: number
  hue: number
}

export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'css'
export type ImageExportFormat = 'png' | 'jpeg' | 'webp'
export type ImageExportSize = 'small' | 'medium' | 'large' | 'xlarge'
