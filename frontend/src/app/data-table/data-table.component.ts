import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
//import { DataTableDataSource} from './data-table-datasource';
import { RestApiService } from '../services/rest-api.service';
import { DataTableItems } from '../models/dataTableItems.model'
import { MatDialog } from '@angular/material/dialog';
import { AddComponent } from '../dialogs/add/add.component';
import { DeleteComponent } from '../dialogs/delete/delete.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { fade } from '../animations/table-row';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
  styles: [
    `/deep/ .mat-sort-header-button {text-shadow: 1px 1px #fff}`
  ],
  animations: [fade]
})
export class DataTableComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<DataTableItems>;
  public dataSource = new MatTableDataSource();
  public environment: any;
  public data: DataTableItems[];
  public selection = new SelectionModel(true, []);
  public multipleSelect: boolean = false;
  public defaultSelectVal: number = 1;
  public completedFilterValue: string = "all";
  public searchFilterValue: string = "";

  displayedColumns = ['multiple_select', 'id', 'title', 'description', 'completed', 'created', 'view', 'delete'];

  constructor(
    private apiService: RestApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    // Get data from database
    this.apiService.getData().subscribe({
      next: (response: any) => {
        this.dataSource = new MatTableDataSource(response);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      },
      error: (errorResponse: any) => {
        console.log('error', errorResponse)
      }
    });
  }

  // INSERT NEW RECORD

  addNew(container) {
    const dialogRef = this.dialog.open(AddComponent, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {

      // Save data from dialog to database

      if (result) {
        this.apiService.insertData(result.value).subscribe({
          next: (response: any) => {
            response.created = new Date().toLocaleString();

            // Append row to top of grid
            container.scroll(0,0);
            this.dataSource.data.push(response);
            this.dataSource.filter = "";

            this.snackBarMsg('Saved successfully!');
          },
          error: (errorResponse: any) => {
            console.log('Save data error!', errorResponse);
          }
        })
      }
    });
  }

  // UPDATE STATUS

  updateStatus(event, id) {
    this.apiService.updateStatus(id, event.checked).subscribe({
      next: (response: any) => {
        this.snackBarMsg('Status changed!')
      },
      error: (errorResponse: any) => {
        console.log('Update status error!', errorResponse);
      }
    })
  }

  // DELETE RECORD

  deleteRecord(id) {
    const dialogRef = this.dialog.open(DeleteComponent, {
      width: '500px',
      data: { id: id }
    });

    dialogRef.afterClosed().subscribe(response => {

      if (response) {
        // Delete record from database
        this.apiService.deleteRecord(id).subscribe({
          next: (response: any) => {
            if (response.count == 1) {

              // Remove row from table on the client side
              const rowIndex = this.dataSource.data.findIndex(x => x['id'] === id);
              this.dataSource.data.splice(rowIndex, 1);
              this.dataSource.filter = "";

              this.snackBarMsg('Record deleted!')
            }
          },
          error: (errorResponse: any) => {
            console.log('Delete record error!', errorResponse);
          }
        })
      }
    });
  }

  // FILTER RECORDS

  applyFilter(event, filterType) {
    
    // Filter records by search input
    if (filterType == 'text-filter') {
      
      // Reset dropdown filter to default. The filters are independent.
      this.completedFilterValue = 'all';

      // Filter only by title and description columns
      this.dataSource.filterPredicate = (data: any, filter) => (data.description.trim().toLowerCase().indexOf(filter.trim().toLowerCase()) !== -1 || data.title.trim().toLowerCase().indexOf(filter.trim().toLowerCase()) !== -1);

      // Fix for filtering empty columns (description can be empty)
      this.dataSource.data.forEach(element => {
        for (const key in Object(element)) {
          if (!element[key] && key == 'description' || element[key] === null) {
            element[key] = '';
          }
        }
      });

      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }


    // Filter records by changing status from dropdown
    if (filterType == 'select-filter') {

        // Reset search filter The filters are independent.
        this.searchFilterValue = '';
        
        this.completedFilterValue = event.value;

        //console.log('test-- ',this.completedFilterValue)
        // Filter only 'completed' column
        this.dataSource.filterPredicate = (data: any, filter) => (data.completed.toString().indexOf(filter) !== -1);

        switch(this.completedFilterValue) {
          case "all":
            this.dataSource.filter = '';
            break;
          case "completed":
            this.dataSource.filter = 'true';
            break;
            case "uncompleted":
              this.dataSource.filter = 'false';
              break;
          default:
            this.dataSource.filter = '';
          }
        }
  }

  // MULTIPLE DELETE  

  removeSelectedRows() {
    // Check if one or more checkboxes are selected
    this.selection.selected.forEach(item => {
      if (item) {
        this.multipleSelect = true;
      }
    });

    if (this.multipleSelect) {
      const dialogRef = this.dialog.open(DeleteComponent, {
        width: '500px',
        data: { multipleDelete: 1 }
      });

      dialogRef.afterClosed().subscribe(response => {
        if (response) {
          // Delete record/s from database
          this.selection.selected.forEach(item => {
            this.apiService.deleteRecord(item.id).subscribe({
              next: (response: any) => {

                // Delete record/s from grid
                let index: number = this.dataSource.data.findIndex(d => d === item);
                this.dataSource.data.splice(index, 1);
                this.dataSource = new MatTableDataSource(this.dataSource.data);
                this.selection = new SelectionModel(true, []);

                // Enable sorting and pagination after dataSource reInitialization
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;

                this.snackBarMsg('Records deleted!');
                this.multipleSelect = false;
              },
              error: (errorResponse: any) => {
                console.log('Multiple delete error!', errorResponse);
              }
            });
          });
        }
      });
    }
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  // FLASH MESSAGES - SNACKBAR

  // ToDo: Separate this as global service
  snackBarMsg(msg) {
    this.snackBar.open(msg, null, {
      duration: 3000,
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource = this.dataSource;
  }
}
