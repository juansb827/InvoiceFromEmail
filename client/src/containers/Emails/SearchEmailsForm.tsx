import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Formik, FormikProps, Form, Field, FieldProps } from "formik";
import { connect } from "react-redux";
import withErrorHandler from "../../hoc/withErrorHandler";

import { Button, Divider, Typography, Card } from "@material-ui/core/";

import CircularProgress from "@material-ui/core/CircularProgress";
import * as yup from "yup";

import FieldFactory from "../../shared/forms/FieldFactory";
import * as fieldFactory from "../../shared/forms/FieldFactory";
import * as api from '../../api/api';
import * as actions from '../../store/actions/index';
import itemTypes from "../../store/itemTypes";
import Dialog from '../../components/UI/Dialog/Dialog';
import axios from '../../axios-instance';

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

const validationSchema = yup.object().shape({
  emailAccountId: yup
    .string()
    .trim()    
    .required("Ingrese la dirección de email"),
  fromDate: yup  
    .date()
    .typeError("Fecha Invalida")
    .required("Ingrese la fecha de inicio"),
  toDate: yup
    .date().typeError('Fecha Invalida') 
    .required("Ingrese la fecha de final")         
    .when('fromDate', (fromDate, schema) => {
      
      if(isNaN(fromDate.getTime())) {
        return;
      }
      console.log(fromDate);
      return yup.date().typeError('Fecha Invalida').min(fromDate, 'La fecha final no puede ser menor a la fecha inicial'); 
      
      
    })
    
    
    
});

const initialValues = { 
  emailAccountId: 2, 
  senderEmail: 'focuscontable@gmail.com', 
          fromDate: "2018-09-20",
          toDate: "2018-09-20" }


class SelectProvider extends React.Component<Props> {  
  
  state = {
    loading: false,
    resultDialogOpen: false,    
    foundEmailsCount: 0
  }
  
  componentDidMount () {      
    this.props.onLoadEmailAccounts();
  }
  
  handleToggleDialog = (open) => {
    this.setState({ resultDialogOpen: open})
  }


  handleSubmit = (values, {resetForm, setSubmitting}) => {       
    return api.searchEmails({
      emailAccountId: values.emailAccountId,
      startingDate: new Date(values.fromDate),
      endingDate: new Date(values.toDate),
      sender: values.senderEmail
    }).then(res => {
      this.setState({ 
        foundEmailsCount: res,
        resultDialogOpen: true
      })
      if (res !== 0) {
        resetForm(initialValues);      
      }
      
    })
    .finally(()=>{
      setSubmitting(false);
    })
  };

  render() {
    const { classes, loadingAccounts } = this.props;
    //const { loading } = this.state
    //console.log('STATE', this.state);

    const accounts = this.props.emailAccounts.map(account => {
        return {
            value: account.id,
            label: account.address
        }
    })

    let msgNoAccounts: any = ''
        if (!loadingAccounts && accounts.length === 0) {
            msgNoAccounts = 
            (<Typography>No tiene cuentas de correo asociadas aun. <br/> En la seccion de configuración puede asociar cuentas de correo.</Typography>);
        }

    const form = formikBag => {
      const { handleSubmit, isSubmitting } = formikBag;
      console.log('FormikBag', formikBag);
      
      return (
        
        <form onSubmit={handleSubmit}>          
          <Typography variant="h6">Busqueda de Emails en Cuenta de Correo</Typography>
          <fieldFactory.WrappedSelectField
            id="emailAccountId"
            name="emailAccountId"
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
              id="fromDate"
              name="fromDate"
              className={classes.formControl}
              label="Fecha Inicio"
              formikBag={formikBag}
              
            />

            <fieldFactory.WrappedDatePicker
              id="toDate"
              name="toDate"
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
                
                
                className={classes.button}
              >
                Continuar
              </Button>              
              {isSubmitting && <CircularProgress className={classes.progress} />}
            </div>
          </div>
        </form>
      );
    };

    return (
      <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={this.handleSubmit}
        render={(formikBag: FormikProps<any>) => form(formikBag)}
      />
      <Dialog           
          open={this.state.resultDialogOpen} 
          onClose={this.handleToggleDialog.bind(this, false)} >
        {this.state.foundEmailsCount === 0 ? 
          'No se han encontrado nuevos correos con los parámetros proporcionados':
          ( 
          <>
            Se han encontrado {this.state.foundEmailsCount} nuevos correos
            <br/> 
            Se analizarán en busca de facturas.
          </>)
          }
        
      </Dialog>
      </>      
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
        const fetchFn = api.getEmailsAccounts;
        const action = actions.changeItemsPage(itemTypes.EMAIL_ACCOUNT, 0, 10, fetchFn);      
        dispatch(action);
      }      
    };
  };

export default 
    connect(
        mapStateToProps,
        mapDispatchToProps)(
            withStyles(styles, { withTheme: true })(
              withErrorHandler(SelectProvider, axios))
        )
  
    



  
  
  