# Style ownership

The app imports global styles, owned Castle controls, the existing presentation
layer, then localization styles. Keep this order explicit in `src/main.jsx`.

`src/styles/castle-controls.css` owns `.cp-stepper`, `.cp-castle-cell` and
`.cp-mobile-cell-label`, including descendants and interactive states. Add or
change their rules there. The surrounding Castle table, score cells, alliance
names and ranking panel remain in `globals.css`.

The control's scoped variables define button width, control height and minimum
entry width. Desktop uses 34px buttons in a 115px bordered container. At 620px
and below, controls use 40px buttons and 42px height; at 380px and below, each
castle control occupies a labeled row above the score cells. These are existing
accepted dimensions, not universal target-size tokens for unrelated components.

Input reset, hover, disabled, focus and focus-visible rules live with the control.
The border dividers retain their existing physical sides and grid placement
inherits locale direction. Changes to either require explicit RTL comparison.
Do not remove table rules based only on an individual stepper screenshot.

For further consolidation, move one owned surface, retain other selectors in
shared rule groups, and compare its effective styles and screenshots before and
after. Include disabled/enabled, hover, keyboard and input focus, boundary widths,
phone/tablet/desktop, and all four locales. Test actual edge clicks, numeric entry
and refresh. A stylesheet split alone does not establish a transfer improvement.
