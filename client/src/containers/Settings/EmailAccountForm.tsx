import React from "react";

import { withStyles } from "@material-ui/core/styles";


import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

import withErrorHandler from "../../hoc/withErrorHandler";
import axios from "../../axios-instance";
import SelectEmailProvider from "./SelectEmailProvider";
import AccessCodeSection from "./AccessCodeSection";

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
    activeStep: 0,
    loading: false,
    formData: {
      emailProvider: "",
      emailAddress: "",
      authUrl: "",
      accessCode: ""
    }
  };

  handleGotAuthUrl = (emailAddress, emailProvider, authUrl) => {
    this.setState({
      activeStep: 1,
      formData: {
        ...this.state.formData,
        authUrl,
        emailAddress,
        emailProvider
      }
    })
  }  

  handleFinish = succesful => {
    this.props.onFinish(true);
  };

  changeStep = (step: number) => {
    this.setState({
      activeStep: step
    })
  }

  reset() {
    this.setState({
      activeStep: 0,
      loading: false,
      authUrlr: ""
    });
  }

  render() {
    const { classes } = this.props;
    const steps = getSteps();
    const { activeStep } = this.state;
    


    const {
      values,
      touched,
      isSubmitting,
      errors,
      handleChange,
      handleSubmit,
      setFieldValue,
      setFieldTouched,
      setTouched
    } = this.props;

    const accountInfo = <SelectEmailProvider 
      parentForm={this.state.formData} 
      onSuccess={this.handleGotAuthUrl}/>;

    const accessSection = (
      <AccessCodeSection 
      parentForm={this.state.formData} 
        onSuccess={this.changeStep.bind(this, 2)} 
        onBackClicked={this.changeStep.bind(this, 0)} />
    );

    const endingSection = (
      <>
        <Typography>Su cuenta fue asociada correctamente</Typography>
        <div className={classes.actionsContainer}>
          <div>
            <Button disabled onClick={() => {}} className={classes.button}>
              Atrás
            </Button>
            <Button
              variant="contained"
              type="submit"
              color="primary"
              onClick={this.handleFinish}
              className={classes.button}
            >
              Finalizar
            </Button>            
          </div>
        </div>
      </>
    );

    const stepContent = [accountInfo, accessSection, endingSection];

    return (
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, index) => {
          return (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>{stepContent[index]}</StepContent>
            </Step>
          );
        })}
      </Stepper>
    );
  }
}


export default withStyles(styles, { withTheme: true })(
  withErrorHandler(EmailAccountForm, axios)
);
