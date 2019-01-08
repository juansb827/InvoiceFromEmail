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
  const { name, id, className, label } = options;
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
        <MenuItem value="GMAIL">GMAIL</MenuItem>
      </Select>
      <FormHelperText>{touched[name] ? errors[name] : ""}</FormHelperText>
    </FormControl>
  );
}
