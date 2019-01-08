import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Formik, FormikProps, Form, Field, FieldProps } from "formik";

import { Button, Typography } from "@material-ui/core/";

import CircularProgress from "@material-ui/core/CircularProgress";
import * as yup from "yup";
import * as api from "../../api/api";

import withErrorHandler from "../../hoc/withErrorHandler";
import axios from "../../axios-instance";
import * as fieldFactory from "../../shared/forms/FieldFactory";

var validationSchema = yup.object({
  accessCode: yup
    .string()
    .trim()
    .required("Ingrese el código de verificación")
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
  onBackClicked: any;
}

class SelectProvider extends React.Component<Props> {
  state = {
    accessCode: "",
    loading: false
  };

  handleSubmit = values => {
    
      this.setState({ loading: true });
      const { accessCode } = values;
      const { emailAddress, emailProvider } = this.props.parentForm;
      api
        .createEmailAccount(accessCode, emailAddress, emailProvider)
        .then(res => {
          this.setState({ loading: false  });
          this.props.onSuccess();
        })
        .catch(err => {
          this.setState({ loading: false });
        });
    
  };

  render() {
    const { classes, onBackClicked } = this.props;
    const { authUrl } = this.props.parentForm;
    const { loading } = this.state;

    const form = formikBag => {
      const { handleSubmit } = formikBag;

      return (
        <form onSubmit={handleSubmit}>
          <Typography>
            Abra este
            <a href={authUrl} target="_blank">
              {" Link "}
            </a>
            para permitir el accesso a su cuenta de correo <br /> Luego copie
            aqui código obtenido
          </Typography>
          {fieldFactory.createTextField(
            {
              id: "access-code",
              label: "Código",
              name: "accessCode",
              className: classes.textField
            },
            formikBag
          )}

          <div className={classes.actionsContainer}>
            <div>
              <Button onClick={onBackClicked} 
                className={classes.button}
                disabled={loading}>
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
