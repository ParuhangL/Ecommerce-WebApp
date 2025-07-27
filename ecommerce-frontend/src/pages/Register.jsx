import { useState, useEffect } from "react";
import { registerUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState({});
  const navigate = useNavigate();

  // Username regex: start with letter, then letters/numbers/underscore, 3-20 chars
  const isUsernameValid = (uname) => /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(uname);
  const isEmailValid = (mail) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.toLowerCase());
  const isPasswordStrong = (pwd) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pwd);

  // Password strength calculation (simple version)
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength("");
      return;
    }
    if (password.length < 8) {
      setPasswordStrength("Too short");
    } else if (!/[A-Z]/.test(password)) {
      setPasswordStrength("Add uppercase letter");
    } else if (!/[a-z]/.test(password)) {
      setPasswordStrength("Add lowercase letter");
    } else if (!/\d/.test(password)) {
      setPasswordStrength("Add a number");
    } else if (!/[@$!%*?&]/.test(password)) {
      setPasswordStrength("Add a special character");
    } else {
      setPasswordStrength("Strong password");
    }
  }, [password]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const newError = {};

    if (!isUsernameValid(username))
      newError.username =
        "Username must start with a letter and be 3–20 characters long, using letters, numbers, or underscores.";

    if (!isEmailValid(email)) newError.email = "Enter a valid email address.";

    if (!isPasswordStrong(password))
      newError.password =
        "Password must have 8+ chars, 1 uppercase, 1 lowercase, 1 number, and 1 special character.";

    if (password !== confirmPassword)
      newError.confirmPassword = "Passwords do not match.";

    if (!termsAccepted)
      newError.terms = "You must accept the Terms & Conditions.";

    if (Object.keys(newError).length > 0) {
      setError(newError);
      return;
    }

    try {
      await registerUser(username, email, password);
      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      const err = error.response?.data?.error;
      if (err) {
        const apiErrors = {};
        if (err.username) apiErrors.username = err.username[0];
        if (err.email) apiErrors.email = err.email[0];
        if (err.password) apiErrors.password = err.password[0];
        setError(apiErrors);
      } else {
        setError({ general: "An unexpected error occurred." });
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      {error.general && <p className="text-red-500">{error.general}</p>}

      <form onSubmit={handleRegister} noValidate>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 w-full my-2"
        />
        {error.username && <p className="text-red-500 text-sm">{error.username}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full my-2"
        />
        {error.email && <p className="text-red-500 text-sm">{error.email}</p>}

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 w-full my-2"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-3 text-sm text-blue-600"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {error.password && <p className="text-red-500 text-sm">{error.password}</p>}

        {passwordStrength && (
          <p
            className={`text-sm ${
              passwordStrength === "Strong password"
                ? "text-green-600"
                : "text-yellow-600"
            }`}
          >
            {passwordStrength}
          </p>
        )}

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border p-2 w-full my-2"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-3 text-sm text-blue-600"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
        {error.confirmPassword && (
          <p className="text-red-500 text-sm">{error.confirmPassword}</p>
        )}

        <label className="flex items-center my-2">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mr-2"
          />
          <span>
            I accept the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Terms & Conditions
            </a>
          </span>
        </label>
        {error.terms && <p className="text-red-500 text-sm">{error.terms}</p>}

        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded mt-2 w-full"
        >
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;
