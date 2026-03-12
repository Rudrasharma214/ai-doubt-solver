import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useResendVerifyEmail, useEmailverification } from '../hooks/Auth/useMutation';
import { useAuth } from '../hooks/Auth/useAuth';
import { useNavigate } from 'react-router-dom';

const EmailVerificationModal = ({ isOpen, onClose, email: initialEmail }) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [email, setEmail] = useState(initialEmail || '');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  const { mutate: resendVerifyEmail, isPending: isResendingEmail } = useResendVerifyEmail();
  const { mutate: verifyEmailOtp, isPending: isVerifyingOtp } = useEmailverification();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter email');
      setError('Please enter email');
      return;
    }

    setError('');
    resendVerifyEmail(email, {
      onSuccess: (response) => {
        if (response.success) {
          setUserId(response.data?.userId);
          setStep('otp');
          setError('');
          toast.success('Verification code sent to your email');
        } else {
          toast.error(response.message || 'Failed to send OTP');
          setError(response.message || 'Failed to send OTP');
        }
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
        toast.error(msg);
        setError(msg);
        console.error('Resend email error:', err);
      },
    });
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter OTP');
      setError('Please enter OTP');
      return;
    }

    setError('');
    verifyEmailOtp(
      { userId, otp },
      {
        onSuccess: (response) => {
          if (response.success) {
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
              auth.setAccessToken(accessToken);
              toast.success('Email verified successfully!');
              onClose();
              navigate('/dashboard');
            } else {
              toast.error(response.message || 'Email verification failed');
              setError(response.message || 'Email verification failed');
            }
          } else {
            toast.error(response.message || 'Email verification failed');
            setError(response.message || 'Email verification failed');
          }
        },
        onError: (err) => {
          const msg = err.response?.data?.message || 'Email verification failed. Please try again.';
          toast.error(msg);
          setError(msg);
          console.error('OTP verification error:', err);
        },
      }
    );
  };

  const handleResendOtp = () => {
    resendVerifyEmail(email, {
      onSuccess: (response) => {
        if (response.success) {
          setError('');
          setOtp('');
          toast.success(response.message || 'OTP resent successfully');
        } else {
          toast.error(response.message || 'Failed to resend OTP');
          setError(response.message || 'Failed to resend OTP');
        }
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Failed to resend OTP';
        toast.error(msg);
        setError(msg);
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'email' ? 'Email not Verified' : 'Enter OTP'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {step === 'email'
              ? 'Enter your email to receive a verification code'
              : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isResendingEmail}
              className="w-full py-2 px-4 rounded-md font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isResendingEmail ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={isVerifyingOtp}
              className="w-full py-2 px-4 rounded-md font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResendingEmail}
              className="w-full py-2 px-4 rounded-md font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isResendingEmail ? 'Resending...' : 'Resend OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtp('');
                setError('');
              }}
              className="w-full py-2 px-4 rounded-md font-semibold text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Change Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationModal;
