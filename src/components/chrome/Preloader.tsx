/**
 * The curtain. `src/lib/motion.ts` counts it to 100 and adds `.is-done`;
 * a 2.6s failsafe lifts it regardless, and `.no-js .loader` hides it outright
 * when scripts never arrive.
 */
export default function Preloader() {
  return (
    <>
      <div className="loader" role="status" aria-live="polite" aria-label="Loading">
        <div className="loader__inner">
          <span className="loader__mark" aria-hidden="true"></span>
          <span className="loader__bar">
            <span className="loader__fill"></span>
          </span>
          <span className="loader__meta mono">
            <span>Elets Events</span>
            <span data-loader-num>000</span>
          </span>
        </div>
      </div>

      <div className="progress" aria-hidden="true">
        <div className="progress__fill"></div>
      </div>

      <a className="skip-link" href="#main">
        Skip to content
      </a>
    </>
  );
}
