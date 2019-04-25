import { Component, ViewChild, DebugElement } from '@angular/core';
import { TestBed, async, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { configureTestSuite } from '../../test-utils/configure-suite';
import { UIInteractions, wait } from '../../test-utils/ui-interactions.spec';
import { DataParent } from '../../test-utils/sample-test-data.spec';
import { Point } from '../../services';

import { IgxGridModule } from './grid.module';
import { IgxGridComponent } from './grid.component';
import { IgxColumnComponent } from '../column.component';
import { IgxGridRowComponent } from './grid-row.component';
import { IgxRowDragDirective } from '../row-drag.directive';
import { IRowDragStartEventArgs, IRowDragEndEventArgs } from '../grid-base.component';
import {
    IgxDropDirective,
    IgxDropEnterEventArgs,
    IgxDropLeaveEventArgs,
    IgxDropEventArgs
} from '../../directives/dragdrop/dragdrop.directive';

const DEBOUNCE_TIME = 50;
const CSS_CLASS_DRAG_INDICATOR = 'igx-grid__drag-indicator';
const CSS_CLASS_GRID_ROW = 'igx-grid__tr';
const CSS_CLASS_DRAG_ROW = 'igx-grid__tr--drag';
const CSS_CLASS_GHOST_ROW = 'igx-grid__tr--ghost';
const CSS_CLASS_SELECTION_CHECKBOX = '.igx-grid__cbx-selection';
const CSS_CLASS_VIRTUAL_HSCROLLBAR = '.igx-vhelper--horizontal';

describe('IgxGrid - Row Drag', () => {
    let fixture: ComponentFixture<any>;
    let grid: IgxGridComponent;
    let dropArea: IgxDropDirective;
    let dropAreaElement: Element;
    let nonDroppableAreaElement: Element;
    let rows: IgxGridRowComponent[];
    let dragIndicatorElements: DebugElement[];
    let dragRows: DebugElement[];
    configureTestSuite();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxGridRowDraggableComponent
            ],
            imports: [
                FormsModule,
                NoopAnimationsModule,
                IgxGridModule
            ]
        }).compileComponents();
    }));

    afterEach(() => {
        UIInteractions.clearOverlay();
    });

    fdescribe('', () => {
        beforeEach(async(() => {
            fixture = TestBed.createComponent(IgxGridRowDraggableComponent);
            grid = fixture.componentInstance.instance;
            dropArea = fixture.componentInstance.dropArea;
            fixture.detectChanges();
            rows = grid.rowList.toArray();
            dropAreaElement = fixture.debugElement.query(By.css('.droppable-area')).nativeElement;
            nonDroppableAreaElement = fixture.debugElement.query(By.css('.non-droppable-area')).nativeElement;
            dragIndicatorElements = fixture.debugElement.queryAll(By.css('.' + CSS_CLASS_DRAG_INDICATOR));
            dragRows = fixture.debugElement.queryAll(By.directive(IgxRowDragDirective));
        }));
        configureTestSuite();

        it('should drag and drop draggable row over droppable container', (async () => {
            const dragIndicatorElement = dragIndicatorElements[2].nativeElement;
            const row = rows[1];
            const rowDragDirective = dragRows[1].injector.get(IgxRowDragDirective);

            const startPoint: Point = UIInteractions.getPointFromElement(dragIndicatorElement);
            const movePoint: Point = UIInteractions.getPointFromElement(rows[4].nativeElement);
            const dropPoint: Point = UIInteractions.getPointFromElement(dropAreaElement);

            spyOn(grid.onRowDragStart, 'emit');
            spyOn(grid.onRowDragEnd, 'emit');
            const dragStartArgs: IRowDragStartEventArgs = {
                owner: rowDragDirective,
                dragData: row,
                cancel: false
            };
            const dragEndArgs: IRowDragEndEventArgs = {
                owner: rowDragDirective,
                dragData: row
            };
            expect(row.dragging).toBeFalsy();
            expect(row.grid.rowDragging).toBeFalsy();

            await pointerDown(dragIndicatorElement, startPoint, fixture);
            await pointerMove(dragIndicatorElement, movePoint, fixture);
            expect(row.dragging).toBeTruthy();
            expect(row.grid.rowDragging).toBeTruthy();
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(1);
            expect(grid.onRowDragStart.emit).toHaveBeenCalledWith(dragStartArgs);

            await pointerMove(dragIndicatorElement, dropPoint, fixture);
            expect(row.dragging).toBeTruthy();
            expect(row.grid.rowDragging).toBeTruthy();

            await pointerUp(dragIndicatorElement, dropPoint, fixture);
            expect(row.dragging).toBeFalsy();
            expect(row.grid.rowDragging).toBeFalsy();
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledTimes(1);
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledWith(dragEndArgs);
        }));
        xit('should be able to drag row only by drag icon', (async () => {
            const dragIndicatorElement = dragIndicatorElements[2].nativeElement;
            const rowDragDirective = dragRows[1].injector.get(IgxRowDragDirective);
            const row = rows[1];
            const rowElement = row.nativeElement;

            const dragIndicatorPoint = UIInteractions.getPointFromElement(dragIndicatorElement);
            const rowPoint = UIInteractions.getPointFromElement(rowElement);
            const movePoint = UIInteractions.getPointFromElement(rows[4].nativeElement);
            spyOn(grid.onRowDragStart, 'emit');
            const dragStartArgs: IRowDragStartEventArgs = {
                owner: rowDragDirective,
                dragData: row,
                cancel: false
            };

            expect(row.dragging).toBeFalsy();
            expect(row.grid.rowDragging).toBeFalsy();

            await pointerDown(rowElement, rowPoint, fixture);
            await pointerMove(rowElement, movePoint, fixture);
            expect(row.dragging).toBeFalsy();
            expect(row.grid.rowDragging).toBeFalsy();
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(0);

            await pointerDown(dragIndicatorElement, dragIndicatorPoint, fixture);
            await pointerMove(dragIndicatorElement, movePoint, fixture);
            expect(row.dragging).toBeTruthy();
            expect(row.grid.rowDragging).toBeTruthy();
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(1);
            expect(grid.onRowDragStart.emit).toHaveBeenCalledWith(dragStartArgs);
        }));
        it('should not be able to drag grid header', (async() => {
            const headerDragIndicatorElement = dragIndicatorElements[0].nativeElement;
            const startPoint: Point = UIInteractions.getPointFromElement(headerDragIndicatorElement);
            const dropPoint: Point = UIInteractions.getPointFromElement(dropAreaElement);
            spyOn(grid.onRowDragStart, 'emit');
            spyOn(grid.onRowDragEnd, 'emit');

            await pointerDown(headerDragIndicatorElement, startPoint, fixture);
            await pointerMove(headerDragIndicatorElement, dropPoint, fixture);
            expect(grid.rowDragging).toBeFalsy();
            expect(grid.onRowDragStart.emit).not.toHaveBeenCalled();
        }));
        it('should not change row data if the data in the drop area has been changed', fakeAsync(() => {
            // TODO
        }));
        it('should cancel dragging when ESCAPE key is pressed.', (async () => {
            const dragIndicatorElement = dragIndicatorElements[2].nativeElement;
            const row = rows[1];

            const startPoint: Point = UIInteractions.getPointFromElement(dragIndicatorElement);
            const dropPoint: Point = UIInteractions.getPointFromElement(dropAreaElement);
            spyOn(grid.onRowDragStart, 'emit');
            spyOn(grid.onRowDragEnd, 'emit');

            await pointerDown(dragIndicatorElement, startPoint, fixture);
            await pointerMove(dragIndicatorElement, dropPoint, fixture);
            expect(row.dragging).toBeTruthy();
            expect(row.grid.rowDragging).toBeTruthy();
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(1);

            UIInteractions.simulateKeyDownEvent(dragIndicatorElement, 'Escape');
            await wait(DEBOUNCE_TIME);
            fixture.detectChanges();
            expect(row.dragging).toBeFalsy();
            expect(row.grid.rowDragging).toBeFalsy();
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledTimes(1);
        }));
        it('should create ghost element upon row dragging', (async () => {
            const dragIndicatorElement = dragIndicatorElements[2].nativeElement;
            const startPoint: Point = UIInteractions.getPointFromElement(dragIndicatorElement);
            const movePoint: Point = UIInteractions.getPointFromElement(rows[4].nativeElement);
            const dropPoint: Point = UIInteractions.getPointFromElement(dropAreaElement);
            let ghostElements: HTMLCollection;

            await pointerDown(dragIndicatorElement, startPoint, fixture);
            await pointerMove(dragIndicatorElement, movePoint, fixture);
            await pointerMove(dragIndicatorElement, dropPoint, fixture);
            ghostElements = document.getElementsByClassName(CSS_CLASS_GHOST_ROW);
            expect(ghostElements.length).toEqual(1);

            await pointerUp(dragIndicatorElement, dropPoint, fixture);
            ghostElements = document.getElementsByClassName(CSS_CLASS_GHOST_ROW);
            expect(ghostElements.length).toEqual(0);
        }));
        it('should apply drag class to row upon row dragging', (async () => {
            const dragIndicatorElement = dragIndicatorElements[2].nativeElement;
            const row = rows[1];

            const startPoint: Point = UIInteractions.getPointFromElement(dragIndicatorElement);
            const movePoint: Point = UIInteractions.getPointFromElement(rows[4].nativeElement);
            const dropPoint: Point = UIInteractions.getPointFromElement(dropAreaElement);

            expect(row.dragging).toBeFalsy();
            expect(row.grid.rowDragging).toBeFalsy();
            expect(row.element.nativeElement.classList.contains(CSS_CLASS_DRAG_ROW)).toBeFalsy();

            await pointerDown(dragIndicatorElement, startPoint, fixture);
            await pointerMove(dragIndicatorElement, movePoint, fixture);
            expect(row.dragging).toBeTruthy();
            expect(row.grid.rowDragging).toBeTruthy();
            expect(row.element.nativeElement.classList.contains(CSS_CLASS_DRAG_ROW)).toBeTruthy();

            await pointerMove(dragIndicatorElement, dropPoint, fixture);
            await pointerUp(dragIndicatorElement, dropPoint, fixture);
            expect(row.dragging).toBeFalsy();
            expect(row.grid.rowDragging).toBeFalsy();
            expect(row.element.nativeElement.classList.contains(CSS_CLASS_DRAG_ROW)).toBeFalsy();
        }));
        it('should align horizontal scrollbar with first non-pinned data cell', fakeAsync(() => {
            // has no draggable and selectable rows
            grid.rowSelectable = false;
            grid.rowDraggable = false;
            tick();
            fixture.detectChanges();
            let rowSelectElement: DebugElement = fixture.debugElement.query(By.css(CSS_CLASS_SELECTION_CHECKBOX));
            let dragIndicatorElement: DebugElement = fixture.debugElement.query(By.css('.' + CSS_CLASS_DRAG_INDICATOR));
            let horizontalScrollbarElement: DebugElement = fixture.debugElement.query(By.css(CSS_CLASS_VIRTUAL_HSCROLLBAR));
            expect(rowSelectElement).toBeNull();
            expect(dragIndicatorElement).toBeNull();

            // has draggable rows and has no selectable rows
            grid.rowSelectable = false;
            grid.rowDraggable = true;
            tick();
            fixture.detectChanges();
            rowSelectElement = fixture.debugElement.query(By.css(CSS_CLASS_SELECTION_CHECKBOX));
            dragIndicatorElement = fixture.debugElement.query(By.css('.' + CSS_CLASS_DRAG_INDICATOR));
            horizontalScrollbarElement = fixture.debugElement.query(By.css(CSS_CLASS_VIRTUAL_HSCROLLBAR));
            const dragIndicatorRect = dragIndicatorElement.nativeElement.getBoundingClientRect();
            let horizontalScrollbarRect = horizontalScrollbarElement.nativeElement.getBoundingClientRect();
            expect(rowSelectElement).toBeNull();
            expect(dragIndicatorRect.right).toBe(horizontalScrollbarRect.left);

            // has draggable and selectable rows
            grid.rowSelectable = true;
            grid.rowDraggable = true;
            fixture.detectChanges();
            rowSelectElement = fixture.debugElement.query(By.css('.igx-grid__cbx-selection'));
            dragIndicatorElement = fixture.debugElement.query(By.css('.' + CSS_CLASS_DRAG_INDICATOR));
            horizontalScrollbarElement = fixture.debugElement.query(By.css('.igx-vhelper--horizontal'));
            const rowSelectRect = rowSelectElement.nativeElement.getBoundingClientRect();
            horizontalScrollbarRect = horizontalScrollbarElement.nativeElement.getBoundingClientRect();
            expect(rowSelectRect.right).toBe(horizontalScrollbarRect.left);
        }));
        it('should fire drag events with correct values of event arguments.', (async () => {
            const rowToDrag: IgxGridRowComponent = rows[2];
            const dragIndicatorElement: Element = dragIndicatorElements[rowToDrag.index].nativeElement;
            const rowDragDirective = dragRows[1].injector.get(IgxRowDragDirective);

            const startPoint: Point = UIInteractions.getPointFromElement(dragIndicatorElement);
            const endPoint: Point = UIInteractions.getPointFromElement(dropAreaElement);

            spyOn(grid.onRowDragStart, 'emit').and.callThrough();
            spyOn(grid.onRowDragEnd, 'emit').and.callThrough();

            await pointerDown(dragIndicatorElement, startPoint, fixture);
            await pointerMove(dragIndicatorElement, endPoint, fixture);
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(1);
            expect(grid.onRowDragStart.emit).toHaveBeenCalledWith({
                dragData: jasmine.any(IgxGridRowComponent),
                owner: rowDragDirective,
                cancel: false
            });

            await pointerMove(dragIndicatorElement, endPoint, fixture);
            await pointerUp(dragIndicatorElement, endPoint, fixture);
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledTimes(1);
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledWith({
                owner: rowDragDirective,
                dragData: jasmine.any(IgxGridRowComponent)
            });
        }));
        it('should emit dragdrop events if dropping a row on a non-interactive area', (async () => {
            const dragIndicatorElement = dragIndicatorElements[2].nativeElement;
            const row = rows[1];
            const rowDragDirective = dragRows[1].injector.get(IgxRowDragDirective);

            const startPoint: Point = UIInteractions.getPointFromElement(dragIndicatorElement);
            const movePoint: Point = UIInteractions.getPointFromElement(rows[4].nativeElement);
            const dropPoint: Point = UIInteractions.getPointFromElement(nonDroppableAreaElement);

            spyOn(grid.onRowDragStart, 'emit');
            spyOn(grid.onRowDragEnd, 'emit');
            const dragStartArgs: IRowDragStartEventArgs = {
                owner: rowDragDirective,
                dragData: row,
                cancel: false
            };
            const dragEndArgs: IRowDragEndEventArgs = {
                owner: rowDragDirective,
                dragData: row
            };
            expect(row.dragging).toBeFalsy();
            expect(row.grid.rowDragging).toBeFalsy();

            await pointerDown(dragIndicatorElement, startPoint, fixture);
            await pointerMove(dragIndicatorElement, movePoint, fixture);
            expect(row.dragging).toBeTruthy();
            expect(row.grid.rowDragging).toBeTruthy();
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(1);
            expect(grid.onRowDragStart.emit).toHaveBeenCalledWith(dragStartArgs);

            await pointerMove(dragIndicatorElement, dropPoint, fixture);
            expect(row.dragging).toBeTruthy();
            expect(row.grid.rowDragging).toBeTruthy();

            await pointerUp(dragIndicatorElement, dropPoint, fixture);
            expect(row.dragging).toBeFalsy();
            expect(row.grid.rowDragging).toBeFalsy();
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledTimes(1);
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledWith(dragEndArgs);
        }));
        it('should emit drop events on droppable area', (async () => {
            const dragIndicatorElement = dragIndicatorElements[3].nativeElement;
            const row = rows[2];
            const rowDragDirective = dragRows[2].injector.get(IgxRowDragDirective);

            const startPoint: Point = UIInteractions.getPointFromElement(dragIndicatorElement);
            const movePoint: Point = UIInteractions.getPointFromElement(rows[4].nativeElement);
            const dropPoint: Point = UIInteractions.getPointFromElement(dropAreaElement);

            spyOn(dropArea.onEnter, 'emit');
            spyOn(dropArea.onLeave, 'emit');
            spyOn(dropArea.onDrop, 'emit');
            spyOn(dropArea, 'onDragEnter').and.callThrough();
            spyOn(dropArea, 'onDragLeave').and.callThrough();
            spyOn(dropArea, 'onDragOver').and.callThrough();
            spyOn(dropArea, 'onDragDrop').and.callThrough();

            await pointerDown(dragIndicatorElement, startPoint, fixture);
            await pointerMove(dragIndicatorElement, movePoint, fixture);
            const pointerMoveEvent = await pointerMove(dragIndicatorElement, dropPoint, fixture).then(ev => ev);

            const elementPosX = dropAreaElement.getBoundingClientRect().left + getWindowScrollLeft();
            const elementPosY = dropAreaElement.getBoundingClientRect().top + getWindowScrollTop();
            const offsetX = dropPoint.x - elementPosX;
            const offsetY = dropPoint.y - elementPosY;
            const dropEnterArgs: IgxDropEnterEventArgs = {
                originalEvent: pointerMoveEvent,
                owner: dropArea,
                drag: rowDragDirective,
                dragData: row,
                startX: startPoint.x,
                startY: startPoint.y,
                pageX: dropPoint.x,
                pageY: dropPoint.y,
                offsetX: offsetX,
                offsetY: offsetY
            };
            expect(dropArea.onEnter.emit).toHaveBeenCalledTimes(1);
            expect(dropArea.onEnter.emit).toHaveBeenCalledWith(dropEnterArgs);
            expect(dropArea.onDragEnter).toHaveBeenCalledTimes(1);

            const pointerUpEvent = await pointerUp(dragIndicatorElement, dropPoint, fixture);
            const dragDropArgs: IgxDropEventArgs = {
                originalEvent: pointerUpEvent,
                owner: dropArea,
                drag: rowDragDirective,
                dragData: row,
                offsetX: offsetX,
                offsetY: offsetY,
                cancel: false
            };
            expect(dropArea.onDrop.emit).toHaveBeenCalledTimes(1);
            expect(dropArea.onDrop.emit).toHaveBeenCalledWith(dragDropArgs);
            expect(dropArea.onDragDrop).toHaveBeenCalledTimes(1);

            // TODO: drag leave should not be called. This is a bug in IgxDropDirective
            // const dragLeaveArgs: IgxDropLeaveEventArgs = {
            //     originalEvent: pointerUpEvent,
            //     owner: dropArea,
            //     drag: rowDragDirective,
            //     dragData: row,
            //     startX: startPoint.x,
            //     startY: startPoint.y,
            //     pageX: dropPoint.x,
            //     pageY: dropPoint.y,
            //     offsetX: offsetX,
            //     offsetY: offsetY
            // };
            // expect(dropArea.onLeave.emit).toHaveBeenCalledTimes(0);
            // expect(dropArea.onLeave.emit).toHaveBeenCalledWith(dragLeaveArgs);
            // expect(dropArea.onDragLeave).toHaveBeenCalledTimes(0);
            // expect(dropArea.onDragOver).toHaveBeenCalledTimes(0);
        }));
        it('should be able to cancel onRowDragStart event.', (async () => {
            grid.onRowDragStart.subscribe((e: IRowDragStartEventArgs) => {
                e.cancel = true;
            });
            const rowToDrag: IgxGridRowComponent = rows[2];
            const dragIndicatorElement: Element = dragIndicatorElements[rowToDrag.index].nativeElement;

            const startPoint: Point = UIInteractions.getPointFromElement(dragIndicatorElement);
            const endPoint: Point = UIInteractions.getPointFromElement(dropAreaElement);

            spyOn(grid.onRowDragStart, 'emit').and.callThrough();
            spyOn(grid.onRowDragEnd, 'emit').and.callThrough();

            await pointerDown(dragIndicatorElement, startPoint, fixture);
            await pointerMove(dragIndicatorElement, endPoint, fixture);
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(1);

            await pointerMove(dragIndicatorElement, endPoint, fixture);
            await pointerUp(dragIndicatorElement, endPoint, fixture);
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledTimes(0);
        }));
        it('multi-row layout integration.', (async () => {
        }));
    });
});


@Component({
    template: `
        <igx-grid #grid
            [width]='width'
            [height]='height'
            [data]="data"
            [autoGenerate]="true" (onColumnInit)="columnsCreated($event)" (onGroupingDone)="onGroupingDoneHandler($event)"
            [rowEditable]="true" [rowDraggable]="enableRowDraggable"
            (onRowDragStart)="handleRowDrag($event)"
            (onRowDragEnd)="handleRowDrop($event)">
        </igx-grid>
        <div #dropArea class="droppable-area" igxDrop
        [ngStyle]="{width:'100px', height:'100px', backgroundColor:'red'}">
        </div>
        <div #nonDroppableArea class="non-droppable-area" igxDrop
        [ngStyle]="{width:'100px', height:'100px', backgroundColor:'yellow'}">
        </div>
    `
})
export class IgxGridRowDraggableComponent extends DataParent {
    public width = '800px';
    public height = null;

    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;

    @ViewChild('dropArea', { read: IgxDropDirective })
    public dropArea: IgxDropDirective;

    public enableSorting = false;
    public enableFiltering = false;
    public enableResizing = false;
    public enableEditing = true;
    public enableGrouping = true;
    public enableRowEditing = true;
    public enableRowDraggable = true;
    public currentSortExpressions;

    public columnsCreated(column: IgxColumnComponent) {
        column.sortable = this.enableSorting;
        column.filterable = this.enableFiltering;
        column.resizable = this.enableResizing;
        column.editable = this.enableEditing;
        column.groupable = this.enableGrouping;
    }
    public onGroupingDoneHandler(sortExpr) {
        this.currentSortExpressions = sortExpr;
    }
    handleRowDrag(args) {
        console.log('RowDrag started!');
    }

    handleRowDrop(args) {
        console.log('Row Drag End!');
    }
}

function getWindowScrollLeft() {
    return window.scrollX ? window.scrollX : (window.pageXOffset ? window.pageXOffset : 0);
}
function getWindowScrollTop() {
    return window.scrollY ? window.scrollY : (window.pageYOffset ? window.pageYOffset : 0);
}

/**
 * Move pointer to the provided point and calls pointerdown event over provided element
 * @param element Element to fire event on
 * @param startPoint Point on which to move the pointer to
 * @param fixture Test's ComponentFixture
 * @returns Promise with reference to the generated event
 */
async function pointerDown(element: Element, startPoint: Point, fixture: ComponentFixture<any>): Promise<PointerEvent> {
    const pointerEvent = UIInteractions.simulatePointerEvent('pointerdown', element, startPoint.x, startPoint.y);
    await wait(DEBOUNCE_TIME);
    fixture.detectChanges();
    return pointerEvent;
}

/**
 * Move pointer to the provided point and calls pointermove event over provided element
 * @param element Element to fire event on
 * @param startPoint Point on which to move the pointer to
 * @param fixture Test's ComponentFixture
 * @returns Promise with reference to the generated event
 */
async function pointerMove(element: Element, startPoint: Point, fixture: ComponentFixture<any>): Promise<PointerEvent> {
    const pointerEvent = UIInteractions.simulatePointerEvent('pointermove', element, startPoint.x, startPoint.y);
    await wait(DEBOUNCE_TIME);
    fixture.detectChanges();
    return pointerEvent;
}

/**
 * Move pointer to the provided point and calls pointerup event over provided element
 * @param element Element to fire event on
 * @param startPoint Point on which to move the pointer to
 * @param fixture Test's ComponentFixture
 * @returns Promise with reference to the generated event
 */
async function pointerUp(element: Element, startPoint: Point, fixture: ComponentFixture<any>): Promise<PointerEvent> {
    const pointerEvent = UIInteractions.simulatePointerEvent('pointerup', element, startPoint.x, startPoint.y);
    await wait(DEBOUNCE_TIME);
    fixture.detectChanges();
    return pointerEvent;
}
