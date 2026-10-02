import AuthBrandPanel from "./AuthBrandPanel";
import "./authExperience.css";

export default function AuthExperienceShell({ mode, children }) {
  return (
    <div className={`cy-auth-experience cy-auth-experience-${mode}`}>
      <AuthBrandPanel mode={mode} />
      {children}
    </div>
  );
}
