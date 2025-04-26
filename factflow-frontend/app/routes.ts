import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.jsx"),
  route("login", "routes/login.jsx"),
  route("register", "routes/register.jsx"),
  route("home", "routes/home.jsx"),
  route("profile", "routes/profile.jsx"),
  route("result/:id", "routes/result.$id.jsx")
] satisfies RouteConfig;
