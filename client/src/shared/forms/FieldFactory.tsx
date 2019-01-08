import React from "react";
import { Formik, FormikProps, Form, Field, FieldProps } from "formik";
import {
  Select,
  TextField,
  FormControl,
  MenuItem,
  InputLabel,
  FormHelperText
} from "@material-ui/core/";

const onChange = function(formikBag, name, e) {
  
  e.persist();
  const { handleChange, setFieldTouched } = formikBag;
  handleChange(e);
  setFieldTouched(name, true, false);
  
};

interface FieldOptions {
  id: string;
  name: string;
  label?: string;
  [key: string]: any;
}

export function createTextField(
  options: FieldOptions,
  formikBag: FormikProps<any>
) {
  const { name } = options;
  const { touched, errors, values } = formikBag;
  return (
    <>
      <TextField
        {...options}
        value={values[name]}
        onChange={e => {
          onChange(formikBag, name, e);
        }}
        helperText={formikBag.touched[name] ? formikBag.errors[name] : ""}
        error={formikBag.touched[name] && Boolean(formikBag.errors[name])}
      />
    </>
  );
}

interface SelectFieldOptions {
  items: Array<{ value: string; label: string }>;
}

export function createSelectField(
  options: FieldOptions & SelectFieldOptions,
  formikBag: FormikProps<any>
) {
  const { name, id, className, label, items } = options;
  const { touched, errors, values } = formikBag;
  return (
    <FormControl
      className={className || ""}
      error={touched[name] && Boolean(errors[name])}
    >
      <InputLabel htmlFor={id}>{label || name}</InputLabel>
      <Select
        value={values[name] || " "}
        onChange={e => {
          onChange(formikBag, name, e);
        }}
        inputProps={{ name, id }}
        error={touched[name] && Boolean(errors[name])}
      >
        <MenuItem value=" ">
          <em>Seleccione</em>
        </MenuItem>
        {items.map(item => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{touched[name] ? errors[name] : ""}</FormHelperText>
    </FormControl>
  );
}



export const WrappedTextField: React.StatelessComponent<FieldOptions> = props => {
  const { name } = props;
  const formikBag = props.formikBag;
  const { touched, errors, values } = formikBag;
  const props2 = {...props};
  delete props2.formikBag;
  return (
    <>
      <TextField
        {...props2}
        value={values[name]}
        onChange={e => {
          onChange(formikBag, name, e);
        }}
        helperText={formikBag.touched[name] ? formikBag.errors[name] : ""}
        error={formikBag.touched[name] && Boolean(formikBag.errors[name])}
      />
    </>
  );
};

export const WrappedDatePicker: any = (props) => {
  const newProps = {
    ...props,
    type: 'date'    
  };
  
  
  return <WrappedTextField {...newProps}/>
}

export const WrappedSelectField: React.StatelessComponent<FieldOptions &SelectFieldOptions> = 
  (props) => {
  
  const { name, id, className, label, items } = props;
  const formikBag = props.formikBag;
  const { touched, errors, values } = props.formikBag;
  return (
    <FormControl
      className={className || ""}
      error={touched[name] && Boolean(errors[name])}
    >
      <InputLabel htmlFor={id}>{label || name}</InputLabel>
      <Select
        value={values[name] || " "}
        onChange={e => {
          onChange(formikBag, name, e);
        }}
        inputProps={{ name, id }}
        error={touched[name] && Boolean(errors[name])}
      >
        <MenuItem value=" ">
          <em>Seleccione</em>
        </MenuItem>
        {items.map(item => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{touched[name] ? errors[name] : ""}</FormHelperText>
    </FormControl>
  );
}


export default class FieldFactory {
  formikBag: FormikProps<any>;

  constructor(formikBag: FormikProps<any>) {
    this.formikBag = formikBag;
    this.hue = this.hue.bind({
      formikBag
    });
  }

  hue(props) {

    const { name } = props;
    const formikBag = props.formikBag;
    const { touched, errors, values } = formikBag;
    const props2 = {...props};
    delete props2.formikBag;
    return (
      <>
        <TextField key={name}
          {...props2}
          value={values[name]}
          onChange={onChange.bind(null, formikBag, name)}
          
          helperText={formikBag.touched[name] ? formikBag.errors[name] : ""}
          error={formikBag.touched[name] && Boolean(formikBag.errors[name])}
        />
      </>
    );
  };

  
}
