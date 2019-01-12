import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:4000/api'    
});

// Alter defaults after instance has been created

instance.defaults.headers.common['x-access-token'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJmaXJzdDRAbWFpbC5jb20iLCJjb21wYW55SWQiOjIsImV4cGlyZXNJbiI6ODY0MDAsImlhdCI6MTU0NzI2MzM0OCwiZXhwIjoxNTQ3MzQ5NzQ4fQ.iGWzwsF0ZSnxZtjiE5VVH3YF_ds2mcV6Nz4pW5T_ypM';

export default instance;