import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutoSizeInputDirective } from './auto-size-input.directive';

@Component({
  standalone: false,
  template: '<div><input pruAutoSizeInput [setParentWidth]="true" value="x"></div>'
})
class AutoSizeInputHostComponent { }

describe('AutoSizeInputDirective', () => {
  let fixture: ComponentFixture<AutoSizeInputHostComponent>;
  let input: HTMLInputElement;
  let parent: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AutoSizeInputHostComponent, AutoSizeInputDirective]
    }).compileComponents();
    fixture = TestBed.createComponent(AutoSizeInputHostComponent);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
    parent = input.parentElement;
  });

  it('resizes its parent when the input content changes', () => {
    const initialWidth = parseFloat(parent.style.width);

    input.value = 'a much longer input value';
    input.dispatchEvent(new Event('input'));
    const longerWidth = parseFloat(parent.style.width);

    input.value = 'x';
    input.dispatchEvent(new Event('input'));
    const shorterWidth = parseFloat(parent.style.width);

    expect(longerWidth).toBeGreaterThan(initialWidth);
    expect(shorterWidth).toBeLessThan(longerWidth);
  });
});
