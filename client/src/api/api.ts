import axios from "../axios-instance";

interface PaginationOptions {
  pageNumber: number;
  rowsPerPage: number;
  filters?: {
    [key: string]: any
  };
}

export const getInvoices = (options: PaginationOptions) => {
  return axios
    .get(`/invoices`, {
      params: {
        page_number: options.pageNumber,
        page_size: options.rowsPerPage
      }
    })
    .then(res => {
      return {
        count: +res.headers["pagination-count"],
        data: res.data
      };
    });
};

export const getInvoiceItems = (invoiceId, options: PaginationOptions) => {
  return axios
    .get(`/invoices/${invoiceId}/items`, {
      params: {
        page_number: options.pageNumber,
        page_size: options.rowsPerPage
      }
    })
    .then(res => {
      return {
        count: +res.headers["pagination-count"],
        data: res.data
      };
    });
};

export const getEmails = (options: PaginationOptions) => {

  const queryParams = {
    page_number: options.pageNumber,
    page_size: options.rowsPerPage,       
  }

  if (options.filters) {
    Object.assign(queryParams, options.filters);
  }  

  return axios
    .get(`/emails`, {
      params: queryParams
    })
    .then(res => {
      return {
        count: +res.headers["pagination-count"],
        data: res.data
      };
    });
};

export const getEmailsAccounts = (options: PaginationOptions) => {
  return axios
    .get(`/emailAccounts`, {
      params: {
        page_number: options.pageNumber,
        page_size: options.rowsPerPage
      }
    })
    .then(res => {
      return {
        count: +res.headers["pagination-count"],
        data: res.data
      };
    });
};

export const getAuthUrl = (emailAddress: string, emailProvider: string) => {
  return axios
    .get(`/emailAccounts/authUrl`, {
      params: {
        emailAddress,
        provider: emailProvider
      }
    })
    .then(res => res.data.redirectUrl)    
};

export const createEmailAccount = (
  verificationCode: string,
  address: string,
  provider: string
) => {
  return axios
    .post(`/emailAccounts/`, {
      verificationCode,
      address,
      provider,
      authType: "XOAUTH2"
    })
    .then(res => {
      return res.data.redirectURL;
    });
};

export const searchEmails = (searchParams: {
  startingDate: Date,
  endingDate: Date,
  sender?: string,
  emailAccountId: number
  [key: string]: any
}) => {
  return axios.get(`/emails/search/`, {
    params: {...searchParams}
  }).then(res => {
    return res.data.foundEmails
  })

}