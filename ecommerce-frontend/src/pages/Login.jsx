import { useState } from "react";
import { loginUser, fetchUserProfile } from "../api/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(username, password);

      // If "Remember me" is checked, persist tokens longer (this is basic, customize as needed)
      if (rememberMe) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("username", username);
      } else {
        // Otherwise store tokens in sessionStorage so cleared on tab close
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("refresh_token", data.refresh);
        sessionStorage.setItem("username", username);
      }

      const profile = await fetchUserProfile();

      alert("Login successful");

      if (profile.is_admin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      alert("Invalid credentials or error during login");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 w-full my-2"
          required
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 w-full my-2"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-3 text-sm text-blue-600"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <label className="flex items-center my-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="mr-2"
          />
          <span>Remember me</span>
        </label>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded mt-2 w-full"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
