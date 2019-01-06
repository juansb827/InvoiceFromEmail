import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Formik, FormikProps, Form, Field, FieldProps } from "formik";
import Input from "@material-ui/core/Input";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import FilledInput from "@material-ui/core/FilledInput";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";
import { Select, TextField } from "@material-ui/core/";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import * as yup from "yup";
import * as api from "../../api/api";

import withErrorHandler from '../../hoc/withErrorHandler';
import axios from '../../axios-instance';

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

function getSteps() {
  return ["Información de la Cuenta", "Permitir Accesso", "Cuenta Asociada"];
}

class EmailAccountForm extends React.Component<any> {
  state = {
    activeStep: 2,
    loading: false,
    authUrl: ""
  };  

  handleNext = () => {
    switch (this.state.activeStep) {
      case 0:
        {
          this.setState({ loading: true });
          const { emailAddress, emailProvider } = this.props.values;
          api.getAuthUrl(emailAddress, emailProvider).then(res => {
            this.setState({
              authUrl: res,
              loading: false,
              activeStep: 1
            });
          }).catch(err => {
            this.setState({ loading: false })            
          })
        }
        break;

      case 1:
        {
          this.setState({ loading: true });
          const { emailAddress, emailProvider, accessCode } = this.props.values;
          api
            .createEmailAccount(accessCode, emailAddress, emailProvider)
            .then(res => {
              this.setState({
                loading: false,
                activeStep: 2
              });
            })
            .catch(err => {
              this.setState({ loading: false })            
            })
        }
        break;
      case 2:
        this.handleFinish(true);
        break;
      default:
        this.setState((state: any) => ({
          activeStep: state.activeStep + 1
        }));
    }
  };

  handleFinish = (succesful) => {
    this.props.onFinish(succesful);    
  };

  handleBack = () => {
    this.setState((state: any) => ({
      activeStep: state.activeStep - 1
    }));
  };

  reset() {
    this.setState({
      activeStep: 0,
      loading: false,
      authUrl: ""
    })
    this.props.resetForm(initialValues);
    
  }

  render() {
    
    const { classes } = this.props;
    const steps = getSteps();
    const { activeStep, authUrl, loading } = this.state;
    const disableBackButton = activeStep === 0 || activeStep === 0 || loading;
    const disableNextButton = loading;

    const {
      values,
      touched,
      isSubmitting,
      errors,
      handleChange,
      handleSubmit,
      setFieldValue,
      setFieldTouched
    } = this.props;

    const change = (name, e) => {
      e.persist();
      handleChange(e);
      //console.log(errors);
      setFieldTouched(name, true, false);
    };

    const accountInfo = (
      <>
        <TextField
          id="email-address"
          label="Dirección"
          name="emailAddress"
          placeholder="Dirección de la cuenta e.g mail@example.com"
          className={classes.textField}
          value={values.emailAddress}
          onChange={change.bind(null, "emailAddress")}
          helperText={touched.emailAddress ? errors.emailAddress : ""}
          error={touched.emailAddress && Boolean(errors.emailAddress)}
        />

        <FormControl
          className={classes.formControl}
          error={touched.emailProvider && Boolean(errors.emailProvider)}
        >
          <InputLabel htmlFor="email-provider">Proveedor</InputLabel>
          <Select
            value={values.emailProvider || " "}
            onChange={change.bind(null, "emailProvider")}
            inputProps={{
              name: "emailProvider",
              id: "email-provider"
            }}
            error={touched.emailProvider && Boolean(errors.emailProvider)}
          >
            <MenuItem value=" ">
              <em>Seleccione</em>
            </MenuItem>
            <MenuItem value="GMAIL">GMAIL</MenuItem>
          </Select>
          <FormHelperText>
            {touched.emailProvider ? errors.emailProvider : ""}
          </FormHelperText>
        </FormControl>
      </>
    );

    const accessSection = (
      <>
        <Typography>
          Abra este
          <a href={authUrl} target="_blank">
            {" Link "}
          </a>
          para permitir el accesso a su cuenta de correo <br /> Luego copie aqui
          código obtenido
        </Typography>

        <TextField
          id="access-code"
          label="Código"
          name="accessCode"
          className={classes.textField}
          value={values.accessCode}
          onChange={change.bind(null, "accessCode")}
          helperText={touched.accessCode ? errors.accessCode : ""}
          error={touched.accessCode && Boolean(errors.accessCode)}
        />
      </>
    );

    const endingSection = (
      <Typography>Su cuenta fue asociada correctamente</Typography>
    );

    const stepContent = [accountInfo, accessSection, endingSection];

    return (
      <form className={classes.root} autoComplete="off">
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => {
            return (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {stepContent[index]}
                  <div className={classes.actionsContainer}>
                    <div>
                      <Button
                        disabled={disableBackButton}
                        onClick={this.handleBack}
                        className={classes.button}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={this.handleNext}
                        className={classes.button}
                        disabled={disableNextButton}
                      >
                        {activeStep === steps.length - 1 ? "Finish" : "Next"}
                      </Button>
                      {this.state.loading && (
                        <CircularProgress className={classes.progress} />
                      )}
                    </div>
                  </div>
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </form>
    );
  }
}
interface MyFormValues {
  firstName: string;
}

const validationSchema = yup.object({
  emailAddress: yup
    .string()
    .trim()
    .email("Ingrese una direccón valida")
    .required("Ingrese la dirección de email"),
  emailProvider: yup
    .string()
    .trim()
    .required("Email provider is required"),
    accessCode: yup
    .string()
    .trim()
    .required("Ingrese el código de verificación"),
    
});

//export default withStyles(styles, { withTheme: true })(EmailAccountForm);
const MyForm = withStyles(styles, { withTheme: true })(
  withErrorHandler(EmailAccountForm, axios)
  );
  var initialValues = { emailAddress: "", emailProvider: "", accessCode: "" } as any
export default function FormContainer(props) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values: MyFormValues) => alert(JSON.stringify(values))}
      render={(formikBag: FormikProps<MyFormValues>) => (
        <MyForm {...props} {...formikBag} />
      )}
    />
  );
}
