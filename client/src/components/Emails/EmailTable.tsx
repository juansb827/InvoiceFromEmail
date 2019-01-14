import React from "react";
import Table from "../UI/Table/Table";
import { createColumn } from "../UI/Table/Table";
import { connect } from "react-redux";
import * as actions from '../../store/actions/index';
import itemTypes from "../../store/itemTypes";
import Button from '@material-ui/core/Button';
import FormGroup from '@material-ui/core/FormGroup';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import * as api from '../../api/api';

const rowsPerPage = 10; 

const headerColumns = [
  createColumn("emailAccount", "Cuenta", "left"),
  createColumn("from", "De"),
  createColumn("subject", "Asunto"),  
  createColumn("invoiceCount", "# Facturas"),
  createColumn("processingState", "Estado")
];


const emails = class extends React.Component<any> {

  componentDidMount() {
    this.props.onChangeFilter('onlyWithInvoice', true, false);
    this.onPageChangeHandler(null, 0);    
  }  
  
  onPageChangeHandler = (_, pageNumber) => {    
    this.props.onPageChange(pageNumber);
  };

  handleFilterChange = (filterName, value, reload = true) => {
    this.props.onChangeFilter(filterName, value)
    if (reload) {
      this.props.onReload();
    }
  }

  render() {
    const controls = 
    (<div>
        <FormControlLabel
          control={
            <Checkbox
              checked={this.props.filters.onlyWithInvoice || false}
              onChange={()=>
                this.handleFilterChange('onlyWithInvoice', !this.props.filters.onlyWithInvoice)                
              }
              value="checkedA"
            />
          }
          label="Mostrar solo correos que contengan facturas"
        />
    </div>)
    return (
      <div>        
        <Table
          rowsPerPage={rowsPerPage}
          customControls={controls}
          count={this.props.emailCount}
          headerColumns={headerColumns}
          title="Emails"
          rows={this.props.rows}
          currentPage={this.props.currentPage}
          onPageChange={this.onPageChangeHandler}
          loading={this.props.loading}
        />           
      </div>
    );
  }
};

const mapStateToProps = state => {
  return { 
    filters: state[itemTypes.EMAIL].filters,
    currentPage: state[itemTypes.EMAIL].currentPage,
    rows: state[itemTypes.EMAIL].items,
    emailCount: state[itemTypes.EMAIL].count,
    loading: state[itemTypes.EMAIL].loading
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onPageChange: pageNumber => {      
      const fetchFn = api.getEmails;
      const action = actions.changeItemsPage(itemTypes.EMAIL, pageNumber, rowsPerPage, fetchFn);      
      dispatch(action);
    },
    onReload: () => {
      const fetchFn = api.getEmails;
      dispatch(actions.reloadItems(itemTypes.EMAIL, fetchFn));
    },
    onChangeFilter: (filterName, newValue) => {             
       dispatch(actions.changeItemsFilter(itemTypes.EMAIL, filterName, newValue));             
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(emails);
