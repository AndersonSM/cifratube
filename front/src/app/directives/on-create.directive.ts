import {Directive, Output, EventEmitter, Input, SimpleChange, OnInit} from '@angular/core';

@Directive({
  selector: '[onCreate]'
})
export class OnCreateDirective implements OnInit {
  @Output() onCreate: EventEmitter<any> = new EventEmitter<any>();
  constructor() {}
  ngOnInit() {
    this.onCreate.emit('');
  }
}
