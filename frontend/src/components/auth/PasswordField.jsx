import { useState } from 'react'

export function PasswordField({ label, ...props }) {
  const [visible, setVisible] = useState(false)
  return <label className="field"><span>{label}</span><span className="password-input"><input {...props} type={visible ? 'text' : 'password'} /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? 'Hide' : 'Show'}</button></span></label>
}
