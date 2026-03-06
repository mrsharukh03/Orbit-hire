'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { checkAuth } from '@/services/authService';
import { useRouter, usePathname } from 'next/navigation';

// Update this interface based on your UserDto/SeekerFullProfileDTO
interface User {
    userId: string;
    fullName: string;
    email: string;
    role: string[]; // ["SEEKER", "USER"] etc.
    profileImage?: string;
    profileComplete?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    setUser: () => { }
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Ye tumhara authService.ts wala function call karega
                const data = await checkAuth();
                if (data) {
                    setUser(data);
                } else {
                    setUser(null);
                }
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [pathname]); // Jab bhi route change hoga, verify karega session active hai ya nahi

    return (
        <AuthContext.Provider value={{ user, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);