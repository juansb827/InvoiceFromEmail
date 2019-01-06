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
  return ["Información de la Cuenta", "Permitir Accesso", "Create an ad"];
}

class EmailAccountForm extends React.Component<any> {
  state = {
    activeStep: 0,
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
          });
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
            });
        }
        break;
      case 2:
        this.handleFinish();
        break;
      default:
        this.setState((state: any) => ({
          activeStep: state.activeStep + 1
        }));
    }
  };

  handleFinish = () => {
    console.log("Finished Process");
  };

  handleBack = () => {
    this.setState((state: any) => ({
      activeStep: state.activeStep - 1
    }));
  };

  handleCompletedSeccion1;

  render() {
    const { classes } = this.props;
    const steps = getSteps();
    const { activeStep, authUrl } = this.state;
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
      console.log(errors);
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
                        disabled={activeStep === 0 || this.state.loading}
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
                        disabled={this.state.loading}
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
    .string("Enter your email")
    .email("Enter a valid email")
    .required("Email is required"),
  emailProvider: yup
    .string("Enter your email-provider")
    .trim()
    .required("Email provider is required")
});

//export default withStyles(styles, { withTheme: true })(EmailAccountForm);
const MyForm = withStyles(styles, { withTheme: true })(EmailAccountForm);
export default function FormContainer() {
  return (
    <Formik
      initialValues={
        { emailAddress: "", emailProvider: "", accessCode: "" } as any
      }
      validationSchema={validationSchema}
      onSubmit={(values: MyFormValues) => alert(JSON.stringify(values))}
      render={(formikBag: FormikProps<MyFormValues>) => (
        <MyForm {...formikBag} />
      )}
    />
  );
}
