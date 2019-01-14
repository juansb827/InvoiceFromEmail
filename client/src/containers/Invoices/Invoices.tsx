import React from "react";
import Table from "../../components/UI/Table/Table";
import { createColumn } from "../../components/UI/Table/Table";
import { connect } from "react-redux";
import * as actions from "../../store/actions/index";
import itemTypes from "../../store/itemTypes";
import Dialog from '../../components/UI/Dialog/Dialog';
import InvoiceItems from "./InvoiceItems";

import * as api from '../../api/api';

const rowsPerPage = 10;

const headerColumns = [
  createColumn("issuer_name", "Empresa", "left"),
  createColumn("code", "Codigo"),
  createColumn("uuid", "Cufe  ")
];

const emails = class extends React.Component<any> {
  state = {
    itemsOpen: false
  };

  componentDidMount() {
    this.onPageChangeHandler(null, 0);
    
  }

  onPageChangeHandler = (_, pageNumber) => {
    this.props.onPageChange(pageNumber);
  };

  onRowClickHandler = (_, row) => {
    this.setState({
      itemsOpen: !this.state.itemsOpen      
    });   
    this.props.onSelectInvoice(row);
  };

  itemsDialogClosedHandler = () => {
    this.setState({
      itemsOpen: false
    });
  };

  render() {
    return (
      <div>
        <Table
          rowsPerPage={rowsPerPage}
          count={this.props.count}
          headerColumns={headerColumns}
          title="Facturas"
          rows={this.props.rows}
          currentPage={this.props.currentPage}
          onPageChange={this.onPageChangeHandler}
          loading={this.props.loading}
          hover={true}
          onRowClick={this.onRowClickHandler}
        />
        <Dialog           
          open={this.state.itemsOpen} 
          onClose={this.itemsDialogClosedHandler}>
          <InvoiceItems />
        </Dialog>        
       
      </div>
    );
  }
};

const mapStateToProps = state => {
  return {
    selectedInvoice: state[itemTypes.INVOICE].selectedItem, 
    currentPage: state[itemTypes.INVOICE].currentPage,
    rows: state[itemTypes.INVOICE].items,
    count: state[itemTypes.INVOICE].count,
    loading: state[itemTypes.INVOICE].loading
  };
};



const mapDispatchToProps = dispatch => {
  return {
    onPageChange: pageNumber => {
      const fetchFn = api.getInvoices;
      const action = actions.changeItemsPage(itemTypes.INVOICE, pageNumber, rowsPerPage, fetchFn);      
      dispatch(action);
    },
    onSelectInvoice: invoice => dispatch(actions.selectItem(itemTypes.INVOICE, invoice)) 
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(emails);
