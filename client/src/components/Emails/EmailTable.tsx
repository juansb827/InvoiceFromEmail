import React from "react";
import Table from "../UI/Table/Table";
import { createColumn } from "../UI/Table/Table";
import { connect } from "react-redux";
import * as actions from '../../store/actions/index';
import Button from '@material-ui/core/Button';

const headerColumns = [
  createColumn("emailAccount", "Cuenta", "left"),
  createColumn("from", "De"),
  createColumn("subject", "Asunto"),  
  createColumn("processingState", "Estado")
];


const emails = class extends React.Component<any> {

  componentDidMount() {
    this.props.onPageChange(this.props.currentPage);
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
          rowsPerPage={10}
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
    currentPage: state.email.currentPage,
    rows: state.email.emails,
    emailCount: state.email.count,
    loading: state.email.loading
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onPageChange: (pageNumber) =>  dispatch(actions.changePage(pageNumber))    
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(emails);
