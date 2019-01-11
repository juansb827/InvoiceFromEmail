import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Formik, FormikProps, Form, Field, FieldProps } from "formik";

import Button from "@material-ui/core/Button";

import CircularProgress from "@material-ui/core/CircularProgress";
import * as yup from "yup";
import * as api from "../../api/api";
import * as fieldFactory from "../../shared/forms/FieldFactory";

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
    minWidth: 120
  },
  textField: {
    margin: theme.spacing.unit,
    width: 400
  },
  progress: {
    position: "relative",
    top: 15,
    margin: theme.spacing.unit * 2
  }
});

interface Props {
  classes: any;
  parentForm: any;
  onSuccess: Function; 
}
class SelectProvider extends React.Component<Props> {


  state = {
    emailProviders: [
      {
        value: "GMAIL",
        label: "GMAIL"
      }
    ],    
    loading: false

  }
  

  handleSubmit = values => {   

    this.setState({ loading: true });    
    const { emailAddress, emailProvider } = values;
    api
      .getAuthUrl(emailAddress, emailProvider)
      .then(authUrl => {        
        this.setState({
          loading: false          
        });
        this.props.onSuccess(emailAddress, emailProvider, authUrl);
      })
      .catch(err => {
        this.setState({ loading: false });
      });
  };

  render() {
    const { classes } = this.props;
    const { loading } = this.state;

    const form = formikBag => {
      const { handleSubmit } = formikBag;

      return (
        <form onSubmit={handleSubmit}>     
          
          {fieldFactory.createTextField(
            {
              id: "email-address",
              label: "Dirección",
              name: "emailAddress",
              placeholder: "Dirección de la cuenta e.g mail@example.com",
              className: classes.textField
            },
            formikBag
          )}
          {fieldFactory.createSelectField(
            {
              id: "email-provider",
              name: "emailProvider",
              className: classes.formControl,
              label: "Proveedor",
              items: this.state.emailProviders
            },
            formikBag
          )}

          <div className={classes.actionsContainer}>
            <div>
              <Button
                disabled={true}
                onClick={() => {}}
                className={classes.button}
              >
                Atrás
              </Button>
              <Button
                variant="contained"
                type="submit"
                color="primary"                
                disabled={loading}
                className={classes.button}
              >
                Continuar
              </Button>
              {loading && <CircularProgress className={classes.progress} />}
            </div>
          </div>
        </form>
      );
    };
    console.log({...this.props.parentForm});
    return (
      <Formik
        initialValues={{...this.props.parentForm}}
        validationSchema={validationSchema}
        onSubmit={this.handleSubmit}
        render={(formikBag: FormikProps<any>) => form(formikBag)}
      />
    );
  }
}

export default withStyles(styles, { withTheme: true })(SelectProvider);
