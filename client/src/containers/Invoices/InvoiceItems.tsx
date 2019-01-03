import React from "react";
import Table from "../../components/UI/Table/Table";
import { createColumn } from "../../components/UI/Table/Table";
import { connect } from "react-redux";
import * as actions from "../../store/actions/index";


import itemTypes from "../../store/itemTypes";

import * as api from '../../api/api';

const rowsPerPage = 5;


const headerColumns = [
  createColumn("code", "Código", "left"),
  createColumn("description", "Descripción"),
  createColumn("price", "Precio"),
  createColumn("quantity", "Cantidad"),
  createColumn("subtotal", "Subtotal ")
];

const emails = class extends React.Component<any> {

  componentDidMount() {
    this.onPageChangeHandler(null, 0);
  }

  onPageChangeHandler = (_, pageNumber) => {
    this.props.onPageChange(pageNumber, this.props.selectedInvoice.id );
  };

  render() {
    return (      
        <Table
          rowsPerPage={rowsPerPage}
          count={this.props.count}
          headerColumns={headerColumns}
          title={this.props.selectedInvoice ? `Items de la Factura ${this.props.selectedInvoice.code}`: null}
          rows={this.props.rows}
          currentPage={this.props.currentPage}
          onPageChange={this.onPageChangeHandler}
          loading={this.props.loading}
        />
    );
  }
};

const mapStateToProps = state => {
  return {
    selectedInvoice: state[itemTypes.INVOICE].selectedItem,
    currentPage: state[itemTypes.INVOICE_ITEMS].currentPage,
    rows: state[itemTypes.INVOICE_ITEMS].items,
    count: state[itemTypes.INVOICE_ITEMS].count,
    loading: state[itemTypes.INVOICE_ITEMS].loading
  };
};


const mapDispatchToProps = dispatch => {
  return {
    onPageChange: (pageNumber, invoiceId) => {      
      const fetchFn = api.getInvoiceItems(invoiceId, pageNumber, rowsPerPage);
      dispatch(
        actions.changeItemsPage(itemTypes.INVOICE_ITEMS, pageNumber, rowsPerPage, fetchFn)
      )

    }
  };
};




export default connect(
  mapStateToProps,
  mapDispatchToProps
)(emails);
