import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import defaultInstance from '../api/defaultInstance';

const storedUser = localStorage.getItem('user');

const initialState = {
    user: storedUser ? JSON.parse(storedUser) : null,
    users: [],
    loading: false,
    error: null
};

export const fetchUsers = createAsyncThunk(
    'user/fetchUsers',
    async (_, { rejectWithValue }) => {
        try {
            const res = await defaultInstance.get('/users');
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Error fetching users');
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action) {
            state.user = action.payload;
            if (action.payload) {
                localStorage.setItem('user', JSON.stringify(action.payload));
            } else {
                localStorage.removeItem('user');
            }
        },
        setUsers(state, action) {
            state.users = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                const currentUser = state.user;
                if (
                    currentUser &&
                    currentUser.role === 'admin' &&
                    currentUser.bank
                ) {
                    state.users = action.payload.filter(
                        u => u.bank === currentUser.bank
                    );
                } else {
                    state.users = action.payload;
                }
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { setUser, setUsers } = userSlice.actions;
export default userSlice.reducer;
