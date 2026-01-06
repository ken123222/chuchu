import { useState } from 'react';
import axios from '../api/axiosConfig';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, Loader2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false); // Track if mail was successfully sent
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");

        try {
            // This hits your backend which uses velasquezkenneth17@gmail.com to send the mail
            await axios.post('/auth/forgot-password', { email });
            
            toast.success("Reset link sent!");
            setIsSent(true); // Switch UI to success message
        } catch (err) {
            console.error("Forgot Pass Error:", err);
            const serverMsg = err.response?.data?.message || "User not found or Server Error";
            if (err.response?.status === 404 || serverMsg.includes('does not exist')) {
                if (email.toLowerCase().endsWith('@gmail.com')) {
                    setErrorMessage('This Gmail address is not registered.');
                } else {
                    setErrorMessage('This email is not registered.');
                }
            } else {
                setErrorMessage(serverMsg);
            }
            toast.error(serverMsg);
        } finally {
            setLoading(false);
        }
    };

    // --- SUCCESS STATE UI ---
    if (isSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 text-center">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Send size={32} className="animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Check your email!</h2>
                    <p className="text-slate-500 font-medium mb-8">
                        We've sent a password reset link to <br />
                        <span className="text-indigo-600 font-bold">{email}</span>
                    </p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition"
                    >
                        RETURN TO LOGIN
                    </button>
                    <p className="mt-6 text-sm text-slate-400 font-medium">
                        Didn't receive it? Check your <span className="font-bold">Spam folder</span>.
                    </p>
                </div>
            </div>
        );
    }

    // --- INITIAL FORM UI ---
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
                <button 
                    onClick={() => navigate('/login')} 
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-6 transition font-bold"
                >
                    <ArrowLeft size={18} /> Back to Login
                </button>
                
                <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight italic">RESET</h2>
                <h2 className="text-2xl font-bold text-slate-700 mb-4 tracking-tight">PASSWORD</h2>
                <p className="text-slate-500 mb-8 font-medium">No worries! Enter your email and we'll send you instructions.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">{errorMessage}</div>
                    )}
                    <div className="relative">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="email" 
                                placeholder="name@example.com" 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex justify-center items-center disabled:opacity-50 active:translate-y-0"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "SEND RESET LINK"}
                    </button>
                </form>
            </div>
        </div>
    );
}