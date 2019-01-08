import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:4000/api'    
});

// Alter defaults after instance has been created
instance.defaults.headers.common['x-access-token'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImVtYWlsIjoiZmlyc3Q1QG1haWwuY29tIiwiY29tcGFueUlkIjoyLCJleHBpcmVzSW4iOjg2NDAwLCJpYXQiOjE1NDY5ODQ1OTMsImV4cCI6MTU0NzA3MDk5M30.TVAusO64EEYw9B6hUr5yHuyyCkcRUYkojjq4NQAEM68';
export default instance;