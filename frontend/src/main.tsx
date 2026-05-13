import "./i18n";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { store } from './store'
import './index.css'
import { router } from "../router.tsx";
import { refresh } from './features/auth/authService.ts';
import { setLoading, setUser } from './store/authSlice';
import { getErrorMessage } from './api/errorHandler';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
    queryCache: new QueryCache({
        onError: (error) => {
            const message = getErrorMessage(error);
            toast.error(message, {
                id: message,
            });
        },
    }),
    mutationCache: new MutationCache({
        onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.skipGlobalError) return;
            const message = getErrorMessage(error);
            toast.error(message, {
                id: message,
            });
        },
    }),
});

refresh()
    .then(result => store.dispatch(setUser(result)))
    .catch(() => store.dispatch(setLoading(false)));

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            borderRadius: '8px',
                            fontSize: '14px',
                        },
                        success: {
                            style: {
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                color: '#15803d',
                            },
                        },
                        error: {
                            style: {
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                            },
                        },
                    }}
                />
            </QueryClientProvider>
        </Provider>
    </StrictMode>,
);