import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { login } from '../services/auth.service';
import { useAuth } from '../hooks/Auth/useAuth';
import { useLoginVerification, useResendLoginOtp } from '../hooks/Auth/useMutation';
import EmailVerificationModal from '../components/EmailVerificationModal';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [userId, setUserId] = useState('');
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [otp, setOtp] = useState('');

  const { mutate: verifyLoginEmail, isPending: isVerifying } = useLoginVerification();
  const { mutate: resendLoginOtp, isPending: isResending } = useResendLoginOtp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        if (response.data?.requiresOtp) {
          // OTP is required for login
          setRequiresOtp(true);
          setUserId(response.data.userId);
          setError('');
          toast.success('OTP sent to your email');
        } else if (response.data?.accessToken) {
          // Login successful without OTP
          auth.setAccessToken(response.data.accessToken);
          toast.success('Logged in successfully');
          navigate('/dashboard');
        } else {
          toast.error(response.message || 'Login failed');
          setError(response.message || 'Login failed');
        }
      } else {
        if (response.message?.includes('Email not verified') || response.status === 403) {
          // Show email verification modal
          setEmailForVerification(formData.email);
          setShowEmailVerificationModal(true);
          toast.error('Please verify your email first');
        } else {
          toast.error(response.message || 'Login failed');
          setError(response.message || 'Login failed');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      if (errorMessage.includes('Email not verified') || err.response?.status === 403) {
        setEmailForVerification(formData.email);
        setShowEmailVerificationModal(true);
        toast.error('Please verify your email first');
      } else {
        toast.error(errorMessage);
        setError(errorMessage);
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter OTP');
      return;
    }

    verifyLoginEmail(
      { userId, otp },
      {
        onSuccess: (response) => {
          if (response.success) {
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
              auth.setAccessToken(accessToken);
              toast.success('Login successful!');
              navigate('/dashboard');
            } else {
              toast.error(response.message || 'OTP verification failed');
              setError(response.message || 'OTP verification failed');
            }
          } else {
            toast.error(response.message || 'OTP verification failed');
            setError(response.message || 'OTP verification failed');
          }
        },
        onError: (err) => {
          const msg = err.response?.data?.message || 'OTP verification failed. Please try again.';
          toast.error(msg);
          setError(msg);
          console.error('OTP verification error:', err);
        },
      }
    );
  };

  const handleResendOtp = () => {
    resendLoginOtp(userId, {
      onSuccess: (response) => {
        setError('');
        setOtp('');
        toast.success('OTP resent successfully');
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
        console.error('Resend OTP error:', err);
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 space-y-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {requiresOtp ? 'Enter OTP' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {!requiresOtp && (
              <>
                Or <Link to="/register" className="text-blue-600 hover:underline">create a new account</Link>
              </>
            )}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {!requiresOtp ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData(prev => ({
                    ...prev,
                    [name]: value,
                  }));
                  setError('');
                }}
                required
                className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData(prev => ({
                    ...prev,
                    [name]: value,
                  }));
                  setError('');
                }}
                required
                className="w-full pl-10 pr-10 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-2.5 right-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="text-sm text-right">
              <Link to="/forgot" className="text-blue-600 hover:underline">Forgot your password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter OTP sent to your email
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setError('');
                }}
                maxLength="6"
                required
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2 px-4 rounded-md font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isVerifying ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="w-full py-2 px-4 rounded-md font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isResending ? 'Resending...' : 'Resend OTP'}
            </button>
          </form>
        )}
      </div>

      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
        email={emailForVerification}
      />
    </div>
  );
};

export default LoginPage;
