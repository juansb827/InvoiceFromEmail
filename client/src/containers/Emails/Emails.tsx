import React, { Component } from "react";

import SearchEmailsForm from './SearchEmailsForm';
import Dialog from '../../components/UI/Dialog/Dialog';
import EmailTable from '../../components/Emails/EmailTable';
import Button from '@material-ui/core/Button';


class Emails extends Component {



  state = {
    dialogOpen: true,
  }

  handleDialogToggled = (open) => {
    this.setState({ dialogOpen: open })
  }

  render() {    
    return (
      <>
        <Button variant="contained" onClick={this.handleDialogToggled.bind(this, true)} >
          Default
        </Button>
        <EmailTable />
        <Dialog           
          open={this.state.dialogOpen} 
          onClose={this.handleDialogToggled.bind(this, false)} >
          <SearchEmailsForm onSuccess={()=>{}}/>
        </Dialog>
        </>
    );
  }
}

export default Emails;
