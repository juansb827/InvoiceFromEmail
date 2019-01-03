import React from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

interface Props {
    open: boolean;
    onClose: any;
    title?: string;    
    children: any;
  }

const CustomDialog: React.StatelessComponent<Props> = props => {

    return (
       <Dialog
        open={props.open}
        onClose={props.onClose}
        fullWidth={true}
        maxWidth="xl"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
      {/*
        <DialogTitle id="alert-dialog-title">
          {props.title}
        </DialogTitle>
      */}
        <DialogContent>
          {props.children}          
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} color="primary">
            Cerrar
          </Button>         
        </DialogActions>
      </Dialog>
    );

}

export default (CustomDialog);