// 🔧 Force Theme Sync Utility
// ใช้สำหรับแก้ปัญหา theme ที่ไม่ sync กัน

export const forceThemeSync = (targetTheme: 'light' | 'dark') => {
  console.log(`🔧 Force syncing theme to: ${targetTheme}`)
  
  const html = document.documentElement
  const classList = html.classList
  
  // Step 1: Remove ALL theme classes aggressively
  classList.remove('light', 'dark')
  
  // Step 2: Check and remove any lingering theme classes
  const allClasses = Array.from(classList)
  allClasses.forEach(className => {
    if (className === 'dark' || className === 'light') {
      classList.remove(className)
    }
  })
  
  // Step 3: Force add target theme
  classList.add(targetTheme)
  
  // Step 4: Update other theme-related attributes
  html.style.colorScheme = targetTheme
  html.setAttribute('data-theme', targetTheme)
  
  // Step 5: Update localStorage
  localStorage.setItem('theme-preference', targetTheme)
  
  // Step 6: Verify the change
  const verification = {
    classes: html.className,
    hasTargetTheme: html.classList.contains(targetTheme),
    hasOppositeTheme: html.classList.contains(targetTheme === 'light' ? 'dark' : 'light'),
    colorScheme: html.style.colorScheme,
    dataTheme: html.getAttribute('data-theme'),
    localStorage: localStorage.getItem('theme-preference')
  }
  
  console.log(`✅ Theme force sync complete:`, verification)
  
  return verification
}

// Global function for browser console testing
if (typeof window !== 'undefined') {
  (window as any).forceThemeSync = forceThemeSync;
  (window as any).forceLightMode = () => forceThemeSync('light');
  (window as any).forceDarkMode = () => forceThemeSync('dark');
  
  console.log('🎯 Global theme utilities available:', {
    'forceThemeSync(theme)': 'Force sync to specific theme',
    'forceLightMode()': 'Force sync to light mode',
    'forceDarkMode()': 'Force sync to dark mode'
  });
}
