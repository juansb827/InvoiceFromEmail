import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Formik, FormikProps, Form, Field, FieldProps } from "formik";
import { connect } from "react-redux";

import { Button, Divider, Typography } from "@material-ui/core/";

import CircularProgress from "@material-ui/core/CircularProgress";
import * as yup from "yup";

import FieldFactory from "../../shared/forms/FieldFactory";
import * as fieldFactory from "../../shared/forms/FieldFactory";
import * as api from '../../api/api';
import * as actions from '../../store/actions/index';
import itemTypes from "../../store/itemTypes";

const validationSchema = yup.object({
  emailAddress: yup
    .string()
    .trim()
    .email("Ingrese una direccón valida")
    .required("Ingrese la dirección de email"),
  emailProvider: yup
    .string()
    .trim()
    .required("Email provider is required")
});

const styles: any = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 200
  },
  textField: {
    margin: theme.spacing.unit,
    width: 400
  },
  progress: {
    position: "relative",
    top: 15,
    margin: theme.spacing.unit * 2
  },
  section2: {
    margin: theme.spacing.unit * 2,
  }
});

interface Props {
  classes: any;
  onSuccess: Function;
  [key: string]: any;
}
class SelectProvider extends React.Component<Props> {  

  componentDidMount () {
      console.log('A');
    this.props.onLoadEmailAccounts();
  }
  


  handleSubmit = values => {
    console.log(values);
  };

  render() {
    const { classes, loadingAccounts } = this.props;
    

    const accounts = this.props.emailAccounts.map(account => {
        return {
            value: account.id,
            label: account.address
        }
    })

    let msgNoAccounts: any = ''
        if (true || !loadingAccounts && accounts.length === 0) {
            msgNoAccounts = 
            (<Typography>No tiene cuentas de correo asociadas aun. <br/> En la seccion de configuración puede asociar cuentas de correo.</Typography>);
        }

    const form = formikBag => {
      const { handleSubmit } = formikBag;
      
      return (
        
        <form onSubmit={handleSubmit}>          
          <Typography variant="h6">Busqueda de Emails en Cuenta de Correo</Typography>
          <fieldFactory.WrappedSelectField
            id="emailAccount"
            name="emailAccount"
            className={classes.formControl}
            label="Cuenta de Correo"
            formikBag={formikBag}
            items={accounts}
          />
          {loadingAccounts && <CircularProgress className={classes.progress} />}
          {msgNoAccounts}
          <Divider />
          <div className={classes.section2}>
            <Typography variant="body2">Parámetros de busqueda</Typography>
            <fieldFactory.WrappedTextField
              id="senderEmail"
              name="senderEmail"
              className={classes.formControl}
              label="Correo del remitente"
              formikBag={formikBag}
            />

            <fieldFactory.WrappedDatePicker
              id="startingDate"
              name="startingDate"
              className={classes.formControl}
              label="Fecha Inicio"
              formikBag={formikBag}
            />

            <fieldFactory.WrappedDatePicker
              id="startingDate"
              name="startingDate"
              className={classes.formControl}
              label="Fecha Fin"
              formikBag={formikBag}
            />
          </div>

          <div className={classes.actionsContainer}>
            <div>              
              <Button
                variant="contained"
                type="submit"
                color="primary"
                onClick={() => {}}
                
                className={classes.button}
              >
                Continuar
              </Button>
              
            </div>
          </div>
        </form>
      );
    };

    return (
      <Formik
        initialValues={{ emailAccount: "", senderEmail: "", startingDate: "1" }}
        validationSchema={{}}
        onSubmit={this.handleSubmit}
        render={(formikBag: FormikProps<any>) => form(formikBag)}
      />
    );
  }
}

const mapStateToProps = state => {
    return {      
      emailAccounts: state[itemTypes.EMAIL_ACCOUNT].items,      
      loadingAccounts: state[itemTypes.EMAIL_ACCOUNT].loading
    };
  };
  
  
  
  const mapDispatchToProps = dispatch => {
    return {
      onLoadEmailAccounts: () => {
        const fetchFn = api.getEmailsAccounts({pageNumber: 0, rowsPerPage: 10});
        const action = actions.changeItemsPage(itemTypes.EMAIL_ACCOUNT, 0, 10, fetchFn);      
        dispatch(action);
      }      
    };
  };

export default 
    connect(
        mapStateToProps,
        mapDispatchToProps)(
            withStyles(styles, { withTheme: true })(SelectProvider)
        )
  
    



  
  
  