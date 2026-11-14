import { RULES } from '../passwordRules.js';

export default function PasswordChecklist({ password }) {
  return (
    <ul className="rules">
      {RULES.map((rule) => (
        <li key={rule.label} className={rule.test(password) ? 'ok' : ''}>
          {rule.label}
        </li>
      ))}
    </ul>
  );
}