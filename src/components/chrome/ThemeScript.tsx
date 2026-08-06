/**
 * Applies the stored (or system) colour theme before first paint, so the page
 * never flashes light before switching to dark. It also drops `.no-js`, which
 * is what un-hides every `[data-reveal]` element when scripts are unavailable.
 *
 * This has to be inline and synchronous — anything deferred is a flash.
 */
const BOOTSTRAP = `(function(){try{var t=localStorage.getItem('elets-theme');
if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
document.documentElement.setAttribute('data-theme',t);
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute('content',t==='dark'?'#08090c':'#f6f5f2');
}catch(e){}
document.documentElement.classList.remove('no-js');})();`;

export default function ThemeScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP }} />;
}
