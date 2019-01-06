import React from "react";
import Table from "../../components/UI/Table/Table";
import { createColumn } from "../../components/UI/Table/Table";
import { connect } from "react-redux";
import * as actions from "../../store/actions/index";
import itemTypes from "../../store/itemTypes";
import Dialog from '../../components/UI/Dialog/Dialog';
import EmailAccountForm from './EmailAccountForm';


import * as api from '../../api/api';

const rowsPerPage = 10;

const headerColumns = [
  createColumn("address", "Email", "left"),
  createColumn("provider", "Proveedor"),
  createColumn("createdAt", "Fecha de Creacion")
];

const emails = class extends React.Component<any> {
  state = {
    itemsOpen: true
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
        <>
        <Table
          rowsPerPage={rowsPerPage}
          count={this.props.count}
          headerColumns={headerColumns}
          title="Cuentas de Correo Asociadas "
          rows={this.props.rows}
          currentPage={this.props.currentPage}
          onPageChange={this.onPageChangeHandler}
          loading={this.props.loading}
          hover={true}
          onRowClick={this.onRowClickHandler}
        />
        <Dialog           
          open={!this.state.itemsOpen} 
          onClose={this.itemsDialogClosedHandler}>
          <EmailAccountForm />
        </Dialog>        
       </>

    );
  }
};

const mapStateToProps = state => {
  return {
    selectedInvoice: state[itemTypes.EMAIL_ACCOUNT].selectedItem, 
    currentPage: state[itemTypes.EMAIL_ACCOUNT].currentPage,
    rows: state[itemTypes.EMAIL_ACCOUNT].items,
    count: state[itemTypes.EMAIL_ACCOUNT].count,
    loading: state[itemTypes.EMAIL_ACCOUNT].loading
  };
};



const mapDispatchToProps = dispatch => {
  return {
    onPageChange: pageNumber => {
      const fetchFn = api.getEmailsAccounts({pageNumber, rowsPerPage});
      const action = actions.changeItemsPage(itemTypes.EMAIL_ACCOUNT, pageNumber, rowsPerPage, fetchFn);      
      dispatch(action);
    },
    onSelectInvoice: invoice => dispatch(actions.selectItem(itemTypes.INVOICE, invoice)) 
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(emails);
