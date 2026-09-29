import { AfterViewInit, Directive, DoCheck, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  standalone: false,
  selector: 'input[pruAutoSizeInput]'
})
export class AutoSizeInputDirective implements AfterViewInit, DoCheck {
  @Input() public extraWidth = 0;
  @Input() public includeBorders = false;
  @Input() public includePadding = true;
  @Input() public includePlaceholder = true;
  @Input() public maxWidth = -1;
  @Input() public minWidth = -1;
  @Input() public setParentWidth = false;

  private _initialized = false;
  private _lastValue = '';

  constructor(private _element: ElementRef<HTMLInputElement>, private _renderer: Renderer2) { }

  public ngAfterViewInit(): void {
    this._initialized = true;
    this.updateWidth();
  }

  public ngDoCheck(): void {
    if (this._initialized && this._element.nativeElement.value !== this._lastValue) {
      this.updateWidth();
    }
  }

  @HostListener('input')
  public onInput(): void {
    this.updateWidth();
  }

  private updateWidth(): void {
    const input = this._element.nativeElement;
    const style = getComputedStyle(input);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const value = input.value || '';
    const placeholder = input.placeholder || '';
    const widthOf = (text: string): number => {
      if (!context) {
        return text.length * parseFloat(style.fontSize);
      }

      context.font = style.font;
      return context.measureText(text).width;
    };
    const text = this.includePlaceholder && widthOf(placeholder) > widthOf(value) ? placeholder : value;
    const padding = this.includePadding
      ? parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      : 0;
    const borders = this.includeBorders
      ? parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)
      : 0;
    const width = widthOf(text) + this.extraWidth + padding + borders;
    const boundedWidth = this.minWidth > 0
      ? Math.max(width, this.minWidth)
      : width;
    const finalWidth = this.maxWidth > 0
      ? Math.min(boundedWidth, this.maxWidth)
      : boundedWidth;
    const target = this.setParentWidth ? input.parentElement : input;

    if (target) {
      this._renderer.setStyle(target, 'width', `${finalWidth}px`);
    }
    this._lastValue = input.value;
  }
}
