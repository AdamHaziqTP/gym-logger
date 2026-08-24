# HUMAN VERIFICATION — M03-T01-E003 Apple Notes colour feasibility

**Status: REQUIRED — target-device gate.** The engineering spike is accepted;
no route is marked successful until tested on the physical iPhone 14 Pro Max.

## Preconditions

- Device: **iPhone 14 Pro Max**.
- Open the trusted URL: `https://192.168.1.49:5173/feasibility/`.
- If Safari shows a certificate warning or the URL is unreachable, record the
  gate as BLOCKED. Do not infer a Notes result.
- Use a scratch Apple Note for probes, not the canonical Gym note.

## Required checklist

Record PASS, FAIL, or BLOCKED for each item, with screenshots for failures:

1. **Capability record:** capture the page's secure-context, Share Sheet,
   file-sharing, ClipboardItem, and HTML-clipboard results.
2. **RTF clipboard probe:** tap the RTF clipboard probe and record the exact
   rejection or unexpected acceptance. Rejection is valid evidence, not a
   product pass.
3. **RTF file handoff:** download/share the `.rtf`; determine whether Notes
   receives a real editable table, an attachment, or flattened content.
4. **HTML file handoff:** share/download the `.html`; record whether Notes
   receives editable table content or only an attachment.
5. **Shortcut route (if willing):** create the page's free user-owned Shortcut,
   run it from HTML source and/or Share Sheet input, and inspect the created
   note.
6. **Success test for the best route:** only PASS if all are true:
   - real editable Apple Notes table, not an image or attachment;
   - correct date, values, row order, weird values, multiline notes, and
     summary override;
   - foreground/highlight colours map Arms orange, Back purple, Chest mint,
     Delts blue, Legs pink;
   - `none/other` rows remain unhighlighted;
   - readable in both Notes appearances;
   - no paid Apple Developer subscription or recurring fragile installation.

## Default if every route fails

Record the exact route outcomes and resolve E-003 through the product bridge as
the approved fallback: keep the current editable rich table/data paste without
colours as a documented iOS/Notes limitation, retain the plain-text fallback,
and continue M03. Do not start another unbounded clipboard experiment.

## Evidence to return

- iPhone model and iOS/Safari versions;
- per-route PASS/FAIL/BLOCKED results;
- exact status/error text;
- screenshots for any failure or claimed success;
- best-route friction and whether any paid/native dependency was required.
