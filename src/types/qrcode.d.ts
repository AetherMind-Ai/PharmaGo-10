declare module 'qrcode.react' {
  import * as React from 'react';

  interface QRCodeProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    bgColor?: string;
    fgColor?: string;
    includeMargin?: boolean;
    imageSettings?: {
      src: string;
      x?: number;
      y?: number;
      height: number;
      width: number;
      excavate?: boolean;
    };
  }

  export class QRCode extends React.Component<QRCodeProps, any> {}
}

declare module 'html-to-image' {
  export function toPng(node: HTMLElement, options?: Options): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  export function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
  export function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
  export function toSvg(node: HTMLElement, options?: Options): Promise<string>;

  interface Options {
    backgroundColor?: string;
    width?: number;
    height?: number;
    style?: Partial<CSSStyleDeclaration>;
    quality?: number;
    pixelRatio?: number;
    cacheBust?: boolean;
    skipFonts?: boolean;
    fontEmbedCss?: string;
    filter?: (node: HTMLElement) => boolean;
  }
}
