/** ID on the main white workspace card in employee department dashboards. */
export const EMPLOYEE_WORKSPACE_ID = 'employee-workspace';

/**
 * The app scrolls inside `<main>`; the page title and scorecard stay above the fold, so
 * changing the sidenav step can look like a no-op unless we scroll this card into view.
 */
export function scrollEmployeeWorkspaceIntoView(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById(EMPLOYEE_WORKSPACE_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
