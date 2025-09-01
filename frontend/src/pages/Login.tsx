import { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileOptimizedInput from '../components/MobileOptimizedInput';
import MobileOptimizedButton from '../components/MobileOptimizedButton';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoLoaded, setLogoLoaded] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Show message from location state (e.g., account locked)
  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const result = await login(
        formData.username,
        formData.password,
        rememberMe
      );

      if (result.success) {
        setSuccess(result.message);
        // Redirect will be handled by useEffect when isAuthenticated changes
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleLogoLoad = () => {
    setLogoLoaded(true);
  };

  const handleLogoError = () => {
    setLogoLoaded(false);
    console.log('Logo failed to load, using fallback icon');
  };

  // Minimal username icon component
  const UsernameIcon = () => (
    <div className="relative flex items-center justify-center">
      <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </div>
  );

  // Minimal password icon component
  const PasswordIcon = () => (
    <div className="relative flex items-center justify-center">
      <div className="w-6 h-6 bg-gray-500 rounded-md flex items-center justify-center">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <circle cx="12" cy="16" r="1" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      {/* Hidden preload image */}
      <img
        src='/plogo.png'
        alt=''
        className='hidden'
        onLoad={handleLogoLoad}
        onError={handleLogoError}
      />

      {/* Left Panel - Branding */}
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden'>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2'></div>
          <div className='absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2'></div>
        </div>

        {/* Content */}
        <div className='relative z-10 flex flex-col justify-center px-12 py-12'>
          <div className='max-w-md'>
            {/* Logo */}
            <div className='flex items-center space-x-3 mb-8'>
              <div className='flex items-center justify-center'>
                {logoLoaded ? (
                  <img
                    src='/plogo.png'
                    alt='PipLine Pro Logo'
                    className='w-16 h-16 object-contain'
                    onLoad={handleLogoLoad}
                    onError={handleLogoError}
                  />
                ) : (
                  <Shield className='w-16 h-16 text-white' />
                )}
              </div>
              <div>
                <h1 className='text-2xl font-bold text-white'>PipLine Pro</h1>
                <p className='text-blue-100 text-sm'>
                  Enterprise Financial Management
                </p>
              </div>
            </div>

            {/* Hero Content */}
            <h2 className='text-4xl font-bold text-white mb-4 leading-tight'>
              Secure Financial Management
            </h2>
            <p className='text-blue-100 text-lg mb-8 leading-relaxed'>
              Streamline your business operations with our comprehensive
              financial management platform. Track transactions, manage PSPs,
              and gain valuable insights.
            </p>

            {/* Features */}
            <div className='space-y-4'>
              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                <span className='text-blue-100'>
                  Real-time transaction monitoring
                </span>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                <span className='text-blue-100'>
                  Advanced analytics & reporting
                </span>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                <span className='text-blue-100'>Multi-PSP integration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className='flex-1 flex items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md'>
          {/* Mobile Logo */}
          <div className='lg:hidden text-center mb-8'>
            <div className='inline-flex items-center space-x-3'>
              <div className='flex items-center justify-center'>
                {logoLoaded ? (
                  <img
                    src='/plogo.png'
                    alt='PipLine Pro Logo'
                    className='w-14 h-14 object-contain'
                    onLoad={handleLogoLoad}
                    onError={handleLogoError}
                  />
                ) : (
                  <Shield className='w-14 h-14 text-blue-600' />
                )}
              </div>
              <div>
                <h1 className='text-xl font-bold text-gray-900'>PipLine Pro</h1>
                <p className='text-gray-500 text-sm'>
                  Enterprise Financial Management
                </p>
              </div>
            </div>
          </div>

          {/* Login Form Card */}
          <div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8'>
            {/* Header */}
            <div className='text-center mb-8'>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                {t('auth.welcome_back')}
              </h2>
              <p className='text-gray-600'>{t('auth.sign_in_to_account')}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3'>
                <AlertCircle className='h-5 w-5 text-red-500 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-red-800'>{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3'>
                <CheckCircle className='h-5 w-5 text-green-500 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-green-800'>
                    {success}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form className='space-y-6' onSubmit={handleSubmit}>
              {/* Username Field */}
              <MobileOptimizedInput
                label={t('auth.username')}
                type="text"
                required
                leftIcon={<UsernameIcon />}
                placeholder={t('auth.username')}
                value={formData.username}
                onChange={e => handleInputChange('username', e.target.value)}
                disabled={isSubmitting}
                inputSize="lg"
                variant="default"
              />

              {/* Password Field */}
              <MobileOptimizedInput
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                required
                leftIcon={<PasswordIcon />}
                rightIcon={
                  <button
                    type='button'
                    className='text-gray-400 hover:text-emerald-600 transition-colors duration-200 hover:scale-110 transform'
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                }
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                disabled={isSubmitting}
                inputSize="lg"
                variant="default"
              />

              {/* Remember Me & Forgot Password */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <input
                    id='remember-me'
                    name='remember-me'
                    type='checkbox'
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor='remember-me'
                    className='ml-2 block text-sm text-gray-700'
                  >
                    {t('auth.remember_me')}
                  </label>
                </div>
                <div className='text-sm'>
                  <a
                    href='#'
                    className='font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline'
                  >
                    {t('auth.forgot_password')}
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <MobileOptimizedButton
                type='submit'
                disabled={isSubmitting}
                loading={isSubmitting}
                size='lg'
                className='w-full'
                icon={isSubmitting ? undefined : <ArrowRight className='h-5 w-5' />}
                iconPosition='right'
              >
                {isSubmitting ? t('auth.signing_in') : t('auth.login')}
              </MobileOptimizedButton>
            </form>
          </div>

          {/* Footer */}
          <div className='mt-8 text-center'>
            <p className='text-xs text-gray-500'>
              &copy; 2025 PipLine Pro. All rights reserved.
            </p>
            <p className='text-xs text-gray-400 mt-1'>
              Enterprise-grade security & compliance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
