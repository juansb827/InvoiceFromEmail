import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { TablePagination } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';

import TableToolbar from './Toolbar/Toolbar';


const styles: any = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
    overflowX: 'auto',
  },
  table: {
    minWidth: 700,
  },
});



 
  
 type Alignment = 'left' | 'center' | 'right'| 'justify' | 'char';
 class Column {
  label: string;
  id: string;
  align: Alignment;
}

interface Props {
    classes: any;
    title: string;
    onPageChange: any;  //event, page
    rows: Array<any>;
    count: number;
    currentPage: number;
    rowsPerPage: number;
    headerColumns: Array<Column>;
    loading: boolean;
    hover?: boolean;
    onRowClick?: Function;
    
}

 const SimpleTable: React.StatelessComponent<Props> = props => {
    
  
    const { classes, title, onPageChange, rows, headerColumns } = props;
    
    
    return (
        <Paper className={classes.root}>
          <TableToolbar title={title} loading={props.loading} />   
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                {headerColumns.map((col) =>
                  <TableCell key={col.id} align={col.align} >{col.label}</TableCell>
                )}                
               
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => {
                return (                  
                  <TableRow key={row.id} hover={props.hover} 
                    onClick={ event => props.onRowClick ? props.onRowClick(event, row) : null }>
                    {headerColumns.map(col => 
                      <TableCell key={col.id} align={col.align}>{row[col.id]}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
    
          </Table>
          <TablePagination
              rowsPerPageOptions={[]}
              rowsPerPage={props.rowsPerPage}
              component="div"
              count={props.count}              
              page={props.currentPage}
              backIconButtonProps={{
                'aria-label': 'Previous Page',
              }}
              nextIconButtonProps={{
                'aria-label': 'Next Page',
              }}
              onChangePage={onPageChange}
              onChangeRowsPerPage={() => {}}
            />    
        </Paper>
      );
  
 
}

export default withStyles(styles, { withTheme: true })(SimpleTable);

export const createColumn = (id, label, align?: Alignment) : Column => {
  return {
    id,
    label,
    align: align ? align: 'right'    
  }
}