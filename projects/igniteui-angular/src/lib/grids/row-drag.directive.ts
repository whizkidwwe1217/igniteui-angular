import { Directive, Input, OnDestroy, NgModule, TemplateRef } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { IgxDragDirective } from '../directives/drag-drop/drag-drop.directive';
import { IRowDragStartEventArgs, IRowDragEndEventArgs } from './common/events';
import { RowType } from './common/grid.interface';


const ghostBackgroundClass = 'igx-grid__tr--ghost';
const gridCellClass = 'igx-grid__td';
const rowSelectedClass = 'igx-grid__tr--selected';
const cellSelectedClass = 'igx-grid__td--selected';
const cellActiveClass = 'igx-grid__td--active';

/**
 * @hidden
 */
@Directive({
    selector: '[igxRowDrag]'
})
export class IgxRowDragDirective extends IgxDragDirective implements OnDestroy {

    @Input('igxRowDrag')
    public set data(value: any) {
        this._data = value;
    }

    public get data(): any {
        return this._data.grid.createRow(this._data.index, this._data.data);
    }

    private subscription$: Subscription;
    private _rowDragStarted = false;

    private get row(): RowType {
        return this._data;
    }

    public onPointerDown(event) {
        event.preventDefault();
        this._rowDragStarted = false;
        this._removeOnDestroy = false;
        super.onPointerDown(event);
    }

    public onPointerMove(event) {
        super.onPointerMove(event);
        if (this._dragStarted && !this._rowDragStarted) {
            this._rowDragStarted = true;
            const args: IRowDragStartEventArgs = {
                dragDirective: this,
                dragData: this.data,
                dragElement: this.row.nativeElement,
                cancel: false,
                owner: this.row.grid
            };

            this.row.grid.rowDragStart.emit(args);
            if (args.cancel) {
                this.ghostElement.parentNode.removeChild(this.ghostElement);
                this.ghostElement = null;
                this._dragStarted = false;
                this._clicked = false;
                return;
            }
            this.row.grid.dragRowID = this.row.key;
            this.row.grid.rowDragging = true;
            this.row.grid.cdr.detectChanges();

            this.subscription$ = fromEvent(this.row.grid.document.defaultView, 'keydown').subscribe((ev: KeyboardEvent) => {
                if (ev.key === this.platformUtil.KEYMAP.ESCAPE) {
                    this._lastDropArea = false;
                    this.onPointerUp(event);
                }
            });
        }
    }

    public onPointerUp(event) {

        if (!this._clicked) {
            return;
        }

        const args: IRowDragEndEventArgs = {
            dragDirective: this,
            dragData: this.data,
            dragElement: this.row.nativeElement,
            animation: false,
            owner: this.row.grid
        };
        this.zone.run(() => {
            this.row.grid.rowDragEnd.emit(args);
        });

        const dropArea = this._lastDropArea;
        super.onPointerUp(event);
        if (!dropArea && this.ghostElement) {
            this.ghostElement.addEventListener('transitionend', this.transitionEndEvent, false);
        } else {
            this.endDragging();
        }
    }

    protected createGhost(pageX, pageY) {
        this.row.grid.gridAPI.crudService.endEdit(false);
        this.row.grid.cdr.detectChanges();
        this.ghostContext = {
            $implicit: this.row.data,
            data: this.row.data,
            grid: this.row.grid
        };
        super.createGhost(pageX, pageY, this.row.nativeElement);

        // check if there is an expander icon and create the ghost at the corresponding position
        if (this.isHierarchicalGrid) {
            const row = this.row as any;
            if (row.expander) {
                const expanderWidth = row.expander.nativeElement.getBoundingClientRect().width;
                this._ghostHostX += expanderWidth;
            }
        }

        const ghost = this.ghostElement;

        const gridRect = this.row.grid.nativeElement.getBoundingClientRect();
        const rowRect = this.row.nativeElement.getBoundingClientRect();
        ghost.style.overflow = 'hidden';
        ghost.style.width = gridRect.width + 'px';
        ghost.style.height = rowRect.height + 'px';

        this.renderer.addClass(ghost, ghostBackgroundClass);
        this.renderer.removeClass(ghost, rowSelectedClass);

        const ghostCells = ghost.getElementsByClassName(gridCellClass);
        for (const cell of ghostCells) {
            this.renderer.removeClass(cell, cellSelectedClass);
            this.renderer.removeClass(cell, cellActiveClass);
        }
    }

    private _unsubscribe() {
        if (this.subscription$ && !this.subscription$.closed) {
            this.subscription$.unsubscribe();
        }
    }

    private endDragging() {
        this.onTransitionEnd(null);
        this.row.grid.dragRowID = null;
        this.row.grid.rowDragging = false;
        this.row.grid.cdr.detectChanges();
        this._unsubscribe();
    }

    private transitionEndEvent = () => {
        if (this.ghostElement) {
            this.ghostElement.removeEventListener('transitionend', this.transitionEndEvent, false);
        }
        this.endDragging();
    };

    private get isHierarchicalGrid() {
        return this.row.grid.nativeElement.tagName.toLowerCase() === 'igx-hierarchical-grid';
    }
}

/**
 * @hidden
 */
@Directive({
    selector: '[igxDragIndicatorIcon]'
})

export class IgxDragIndicatorIconDirective {
}

/**
 * @hidden
 */
@Directive({
    selector: '[igxRowDragGhost]'
})

export class IgxRowDragGhostDirective {
    constructor(public templateRef: TemplateRef<any>) { }
}

@NgModule({
    declarations: [IgxRowDragDirective, IgxDragIndicatorIconDirective, IgxRowDragGhostDirective],
    exports: [IgxRowDragDirective, IgxDragIndicatorIconDirective, IgxRowDragGhostDirective],
})
export class IgxRowDragModule { }
