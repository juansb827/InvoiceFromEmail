import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:4000/api'    
});

// Alter defaults after instance has been created
instance.defaults.headers.common['x-access-token'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImVtYWlsIjoiZmlyc3Q1QG1haWwuY29tIiwiY29tcGFueUlkIjoyLCJleHBpcmVzSW4iOjg2NDAwLCJpYXQiOjE1NDYxMDQ5NDMsImV4cCI6MTU0NjE5MTM0M30.DdVwBHekuP2dokYDKb05cSy_BwHCTXzHseaAp6jjSrY';
export default instance;