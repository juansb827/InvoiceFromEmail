import React from "react";
import Table from "../UI/Table/Table";
import { createColumn } from "../UI/Table/Table";
import { connect } from "react-redux";
import * as actions from '../../store/actions/index';
import itemTypes from "../../store/itemTypes";
import Button from '@material-ui/core/Button';
import * as api from '../../api/api';

const rowsPerPage = 10; 

const headerColumns = [
  createColumn("emailAccount", "Cuenta", "left"),
  createColumn("from", "De"),
  createColumn("subject", "Asunto"),  
  createColumn("processingState", "Estado")
];


const emails = class extends React.Component<any> {

  componentDidMount() {
    this.onPageChangeHandler(null, 0);    
  }  
  
  onPageChangeHandler = (_, pageNumber) => {    
    this.props.onPageChange(pageNumber);
  };

  render() {
    return (
      <div>
        <Button variant="contained" >
          Default
        </Button>
        <Table
          rowsPerPage={rowsPerPage}
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
    currentPage: state[itemTypes.EMAIL].currentPage,
    rows: state[itemTypes.EMAIL].items,
    emailCount: state[itemTypes.EMAIL].count,
    loading: state[itemTypes.EMAIL].loading
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onPageChange: pageNumber => {
      const fetchFn = api.getEmails({ rowsPerPage, pageNumber });
      const action = actions.changeItemsPage(itemTypes.EMAIL, pageNumber, rowsPerPage, fetchFn);      
      dispatch(action);
    }  
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(emails);
