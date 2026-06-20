/**
 * Copy text to clipboard with multiple fallback strategies.
 * Works on localhost, HTTPS, and older browsers.
 */
export const copyToClipboard = async (text) => {
  if (!text) return false;

  // Strategy 1: Modern Clipboard API (works on HTTPS and localhost)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API failed (permissions denied, etc.) — try fallback
    }
  }

  // Strategy 2: execCommand fallback (works in most browsers)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Prevent scrolling to bottom
    textArea.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:none;outline:none;box-shadow:none;opacity:0;';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    // For iOS
    textArea.setSelectionRange(0, text.length);
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) return true;
  } catch {
    // execCommand also failed
  }

  // Strategy 3: window.clipboardData (IE/older Edge)
  try {
    if (window.clipboardData && window.clipboardData.setData) {
      window.clipboardData.setData('Text', text);
      return true;
    }
  } catch {
    // All strategies failed
  }

  return false;
};
