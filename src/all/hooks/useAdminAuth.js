/**
 * useAdminAuth — SHA-256 hashed credentials.
 * Plain text is NEVER stored — only hashes.
 * Contact the platform owner for access credentials.
 */

const SESSION_KEY = 'foryou_admin_v1';
const SESSION_EXPIRY_KEY = 'foryou_admin_exp';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

// SHA-256 hashes — plain text never stored in executable code
const H_USERNAME = 'dfc43b3fd243a140d79afd86f988a034bd42c0430aa825424e0c0ea1bffe8117';
const H_PASSWORD = '31296e7fe96a8441e7ec335812a3a5777c046269d7c132800858b2dcfec56e01';

/** SHA-256 via Web Crypto API */
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isAdminLoggedIn() {
  try {
    const loggedIn = sessionStorage.getItem(SESSION_KEY) === 'true';
    if (!loggedIn) return false;
    
    // Check session expiry (if set)
    const expiryStr = sessionStorage.getItem(SESSION_EXPIRY_KEY);
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        adminLogout();
        return false;
      }
    } else {
      // Legacy session without expiry — set one now
      sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
    }
    return true;
  } catch { return false; }
}

export async function adminLogin(username, password) {
  const [hu, hp] = await Promise.all([
    sha256(username.trim()),
    sha256(password),
  ]);
  const ok = hu === H_USERNAME && hp === H_PASSWORD;
  if (ok) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
  }
  return ok;
}

export function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
}
