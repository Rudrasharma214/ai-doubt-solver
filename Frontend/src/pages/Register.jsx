import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRegister } from '../hooks/Auth/useMutation.js';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { mutate: register } = useRegister();


  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    register(
      {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      },
      {
        onSuccess: (data) => {
          setIsSubmitting(false);
          toast.success('Account created! Please verify your email.');
          // Navigate to email verification with userId
          if (data.data?.userId || data.data?.id) {
            const userId = data.data.userId || data.data.id;
            navigate(`/email/verify/${userId}`);
          } else {
            // Fallback if no userId in response
            navigate('/login');
          }
        },
        onError: (error) => {
          setIsSubmitting(false);
          const message = error.response?.data?.message || 'Registration failed';
          toast.error(message);
          setErrors({ submit: message });
        }
      }
    );
  };

  //   if (isLoading) {
  //     return (
  //       <div className="min-h-screen flex items-center justify-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  //       </div>
  //     );
  //   }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 space-y-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {[{
            id: 'name',
            name: 'name',
            icon: <User className="h-5 w-5 text-gray-400" />, placeholder: 'Full name',
          }, {
            id: 'email',
            name: 'email',
            icon: <Mail className="h-5 w-5 text-gray-400" />, placeholder: 'Email address',
          }].map(({ id, name, icon, placeholder }) => (
            <div key={id} className="relative">
              {icon && <div className="absolute top-3 left-3">{icon}</div>}
              <input
                id={id}
                name={name}
                type="text"
                autoComplete={name}
                required
                value={formData[name]}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={`w-full pl-10 pr-3 py-2 rounded-md border ${errors[name] ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none`}
              />
              {errors[name] && <p className="mt-1 text-sm text-red-600">{errors[name]}</p>}
            </div>
          ))}

          {[{
            id: 'password',
            name: 'password',
            show: showPassword,
            toggle: () => setShowPassword(!showPassword),
            placeholder: 'Password'
          }, {
            id: 'confirmPassword',
            name: 'confirmPassword',
            show: showConfirmPassword,
            toggle: () => setShowConfirmPassword(!showConfirmPassword),
            placeholder: 'Confirm password'
          }].map(({ id, name, show, toggle, placeholder }) => (
            <div key={id} className="relative">
              <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input
                id={id}
                name={name}
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData[name]}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={`w-full pl-10 pr-10 py-2 rounded-md border ${errors[name] ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none`}
              />
              <button type="button" className="absolute top-2.5 right-3 text-gray-400" onClick={toggle}>
                {show ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors[name] && <p className="mt-1 text-sm text-red-600">{errors[name]}</p>}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 rounded-md font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? (
              <div className="flex justify-center items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent"></div>
                Creating account...
              </div>
            ) : 'Create account'}
          </button>

          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
