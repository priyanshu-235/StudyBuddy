import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router'; 
import { loginUser, clearAuthError } from "../authSlice";
import AlertBanner from '../components/AlertBanner';
import { useEffect, useState } from 'react';
import "./login.css";

const loginSchema = z.object({
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak") 
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) }); // Using renamed schema

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(clearAuthError());
    dispatch(loginUser(data));
  };

  return (

    <div className="min-h-screen flex items-center justify-center p-4 bg-[#07110c] relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0f3d2e_0%,#07110c_70%)]" />
    
    <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/10 blur-3xl rounded-full" />
    <div className="absolute bottom-20 right-20 w-72 h-72 bg-green-400/10 blur-3xl rounded-full" />
      <div className="animated-border relative w-[420px] rounded-3xl p-[2px]">
      <div className="bg-[#0b1410] rounded-3xl backdrop-blur-xl shadow-[0_20px_60px_rgba(0,255,150,0.15)]">
        <div className="card-body">
                <div className="flex justify-center mb-4">
                <div
                  className="
                  animate-[float_4s_ease-in-out_infinite]
                  w-16
                  h-16
                  rounded-2xl
                  bg-gradient-to-br
                  from-emerald-400
                  via-emerald-500
                  to-green-700
                  flex
                  items-center
                  justify-center
                  shadow-[0_0_35px_rgba(16,185,129,0.45)]
                "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
              StudyBuDDy
          </h1>

          <p className="text-gray-400 mt-2">
              Practice. Learn. Dominate.
          </p>
        </div>

          <AlertBanner type="error" message={error} className="mb-4" />

          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-control"> {/* Removed mt-4 from first form-control for tighter spacing to title or global error */}
              <label className="label"> {/* Removed mb-1, default spacing should be fine */}
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className={`input
                            w-full
                            bg-[#111b16]
                            border
                            border-emerald-900
                            focus:border-emerald-400
                            focus:outline-none
                            text-white
                            transition-all
                            duration-300 ${errors.emailId ? 'input-error' : ''}`} 
                {...register('emailId')}
              />
              {errors.emailId && (
                <span className="text-error text-sm mt-1">{errors.emailId.message}</span>
              )}
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input
                              w-full
                              bg-[#111b16]
                              border
                              border-emerald-900
                              focus:border-emerald-400
                              focus:outline-none
                              text-white
                              transition-all
                              duration-300 pr-10 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-emerald-400 hover:text-emerald-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-error text-sm mt-1">{errors.password.message}</span>
              )}
            </div>

            <div className="form-control mt-8 flex justify-center">
              <button
                type="submit"
                className={`w-full
                            h-12
                            rounded-xl
                            font-semibold
                            text-white
                            bg-gradient-to-r
                            from-emerald-600
                            to-green-500
                            hover:from-emerald-500
                            hover:to-green-400
                            shadow-[0_10px_25px_rgba(16,185,129,0.35)]
                            hover:shadow-[0_15px_35px_rgba(16,185,129,0.55)]
                            transition-all
                            duration-300
                            hover:-translate-y-1 ${loading ? 'loading btn-disabled' : ''}`} // Added btn-disabled for better UX with loading
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Logging in...
                  </>
                ) : 'Login'}
              </button>
            </div>
          </form>
          <div className="text-center mt-8 text-gray-400"> {/* Increased mt for spacing */}
            <span className="text-sm">
              Don't have an account?{' '}
              <NavLink
                  to="/signup"
                  className="
                    text-emerald-400
                    hover:text-emerald-300
                    transition-colors
                    font-medium
                  "
                >
                  Signup
                </NavLink>
            </span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Login;