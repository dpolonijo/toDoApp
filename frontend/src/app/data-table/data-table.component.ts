import { AfterViewInit, Component, OnInit, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { DataTableDataSource} from './data-table-datasource';
import { RestApiService } from '../services/rest-api.service';
import { DataTableItems } from '../models/dataTableItems.model'
import { MatDialog } from '@angular/material/dialog';
import { AddComponent } from '../dialogs/add/add.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<DataTableItems>;
  dataSource: DataTableDataSource;
  public environment: any;

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['id','title','description','completed','created'];

  
  constructor(
    private apiService: RestApiService,
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.dataSource = new DataTableDataSource(this.apiService);
  }

  addNew() {
    const dialogRef = this.dialog.open(AddComponent, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog Results---', result.value);

      // Save data from dialog to database

      this.apiService.insertData(result.value).subscribe({
        next: (response: any) => {
          console.log('Save data response ... ', response);
        },
        error: (errorResponse: any) => {
          console.log('Save data error!', errorResponse);
        }
      })
    });
    
  }
  
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }
}
