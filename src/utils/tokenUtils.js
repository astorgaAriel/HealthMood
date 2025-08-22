// src/utils/tokenUtils.js
export const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

export const getTokenInfo = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded) return null;

  const now = Date.now() / 1000;
  const isExpired = decoded.exp < now;
  const expiresIn = decoded.exp - now;

  return {
    decoded,
    isExpired,
    expiresIn: Math.max(0, expiresIn),
    expiresInMinutes: Math.max(0, expiresIn / 60),
    role: decoded.role,
    email: decoded.email || decoded.sub
  };
};
