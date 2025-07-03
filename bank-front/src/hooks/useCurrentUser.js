import { useState, useEffect } from 'react';
import defaultInstance from '../api/defaultInstance';

const useCurrentUser = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        defaultInstance.get('/user')
            .then(res => setUser(res.data))
            .catch(() => setUser(null));
    }, []);

    return user;
};

export default useCurrentUser;
