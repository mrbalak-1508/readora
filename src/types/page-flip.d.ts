declare module "page-flip" {
  export class PageFlip {
    constructor(element: HTMLElement, setting: any);
    destroy(): void;
    update(): void;
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    loadFromImages(imagesHref: string[]): void;
    turnToPage(pageNumber: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(pageNumber: number, corner?: "top" | "bottom"): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    on(event: string, callback: (e: any) => void): void;
    off(event: string, callback: (e: any) => void): void;
  }
}

declare module "react-pageflip" {
  import React from "react";

  export interface FlipBookProps {
    width?: number;
    height?: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    startPage?: number;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
    renderOnlyPageLengthChange?: boolean;
    onFlip?: (e: { data: number }) => void;
    onChangeOrientation?: (e: any) => void;
    onChangeState?: (e: any) => void;
    onInit?: (e: any) => void;
    onUpdate?: (e: any) => void;
  }

  export interface IFlipBookMethods {
    pageFlip: () => import("page-flip").PageFlip;
  }

  const HTMLFlipBook: React.ForwardRefExoticComponent<
    FlipBookProps & React.RefAttributes<IFlipBookMethods>
  >;

  export default HTMLFlipBook;
}
